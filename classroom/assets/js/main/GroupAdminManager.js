/**
 * managerManager
 * Copyright 2021 Vittascience.
 * https://vittascience.com
 *
 *
 */

/**
 * @class GroupAdminManager
 * @author: COINTE Rémi
 */
class GroupAdminManager {
    /**
     * Creates an instance of GroupAdminManager.
     * @public
     */
    constructor() {
        this._allGroups = []
        this._actualGroup = 0
        this._addedCreateUserGroup = 0
        this._updatedUserGroup = 0
        this._comboGroups = []
        this._paginationUsersInfo = []
        this._paginationGroupsInfo = []
        this._acutalGroupDetails = []
        this._actualUser = []
        this._tasksQueue = [];
        this._isExecutingTaskInQueue = false;
    }

    /**
     * GROUPS FUNCTION
     */

    isGroupAdmin() {
        return new Promise(function (resolve, reject) {
            $.ajax({
                type: "POST",
                url: "/routing/Routing.php?controller=groupadmin&action=is_user_groupadmin",
                success: function (response) {
                    resolve(JSON.parse(response));
                },
                error: function () {
                    reject();
                }
            });
        })
    }


    getGroupLink(group_id) {
        return new Promise(function (resolve, reject) {
            $.ajax({
                type: "POST",
                url: "/routing/Routing.php?controller=groupadmin&action=get_group_link",
                data: {
                    group_id: group_id
                },
                success: function (response) {
                    resolve(JSON.parse(response));
                },
                error: function () {
                    reject();
                }
            });
        })
    }

    getGroupUserAdminId() {
        return new Promise(function (resolve, reject) {
            $.ajax({
                type: "POST",
                url: "/routing/Routing.php?controller=groupadmin&action=get_group_id",
                success: function (response) {
                    resolve(JSON.parse(response));
                },
                error: function () {
                    reject();
                }
            });
        })
    }

    /**
     * Get actual group informations
     * Access with Main.getmanagerManager()._actualGroupInfos
     * @public
     * @returns {Array}
     */
    getGroupsUserAdmin() {
        const process = (data) => {
            let data_table = "";
            this._comboGroups = data;
            data.forEach(element => {
                // there is only one group possible
                this._actualGroup = element.id;
                let div_img = ""
                if (element.hasOwnProperty('applications')) {
                    element.applications.forEach(element_2 => {
                        if (element_2.image != null && element_2.image != "") {
                            div_img += `<img src="${element_2.image}" data-bs-toggle="tooltip" alt="${element_2.name}" title="${element_2.name}" style="max-height: 24px;" class="mx-1">`;
                        } else {
                            div_img += `<img src="assets/media/no-app-icon.svg" data-bs-toggle="tooltip" alt="${element_2.name}" title="${element_2.name}" style="max-height: 24px;" class="mx-1">`;
                        }
                    });
                }
                data_table +=
                    `<tr>
                        <th scope="row">${element.name}</i></th>
                        <td>${element.description}</td>
                        <td>
                            ${div_img}
                        </td>
                        <td>
                            <a class="c-link-tertiary" href="javascript:void(0)" onclick="getGroupLinkGA(${element.id})" alt="${i18next.t('manager.buttons.show')}">
                                <i class="fas fa-link fa-2x"></i>
                            </a>
                        </td>
                    </tr>`;
                $('#groups_table_groupadmin').html(data_table);
            });
            this.getUsersFromGroup(this._actualGroup, 1);
        }
        $.ajax({
            type: "POST",
            url: "/routing/Routing.php?controller=groupadmin&action=get_all_groups_where_user_is_admin",
            success: function (response) {
                process(JSON.parse(response));
            },
            error: function (e) {
                console.error(e);
            }
        });
    }

    /**
     * Récupère et affiche les utilisateurs d'un groupe.
     * @param {number} group_id - L'identifiant du groupe.
     * @param {number} page - La page à afficher.
     */
    getUsersFromGroup(group_id, page) {
        this._actualGroup = group_id;

        const sortEl = document.getElementById('sort_users_filter_groupadmin');
        const usersPerPageEl = document.getElementById('users_per_page_groupadmin');
        const sort = sortEl ? sortEl.value : "";
        const usersPerPage = usersPerPageEl ? usersPerPageEl.value : "";

        this.fetchUsersFromGroup(group_id, sort, usersPerPage, page)
            .then(responseText => {
                const data = JSON.parse(responseText);
                this.processUsersData(data, group_id);
            })
            .catch(error => {
                console.error(error);
            });
    }

    /**
     * Effectue la requête fetch pour obtenir les utilisateurs.
     * @param {number} group_id 
     * @param {string} sort 
     * @param {string} usersPerPage 
     * @param {number} page 
     * @returns {Promise<string>}
     */
    fetchUsersFromGroup(group_id, sort, usersPerPage, page) {
        const url = "/routing/Routing.php?controller=groupadmin&action=get_all_users_in_group";
        const formData = new URLSearchParams();
        formData.append("group_id", group_id);
        formData.append("sort", sort);
        formData.append("userspp", usersPerPage);
        formData.append("page", page);

        return fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: formData.toString()
        }).then(response => response.text());
    }

    /**
     * Traite les données retournées par la requête.
     * @param {Array} data - Les données renvoyées.
     * @param {number} group_id - L'identifiant du groupe.
     */
    processUsersData(data, group_id) {
        let dataTableActive = "";
        let dataTableInactive = "";

        data.forEach(element => {
            // Si c'est un objet de pagination
            if (element.hasOwnProperty('currentPage')) {
                const paginationHtml = this.generatePaginationButtons(element, group_id);
                const paginationContainer = document.getElementById('paginationButtons_users_groupadmin');
                if (paginationContainer) {
                    paginationContainer.innerHTML = paginationHtml;
                }
            } else {
                // Ligne utilisateur
                const rowHtml = this.isActive(element)
                    ? this.generateActiveUserRow(element)
                    : this.generateInactiveUserRow(element);
                if (this.isActive(element)) {
                    dataTableActive += rowHtml;
                } else {
                    dataTableInactive += rowHtml;
                }
            }
        });

        const tableActiveEl = document.getElementById('table_info_group_data_groupadmin');
        const tableInactiveEl = document.getElementById('table_info_group_data_groupadmin_inactive');
        if (tableActiveEl) tableActiveEl.innerHTML = dataTableActive;
        if (tableInactiveEl) tableInactiveEl.innerHTML = dataTableInactive;

        this.initTooltips();
    }

    /**
     * Génère le HTML pour les boutons de pagination.
     * @param {Object} paginationData - Les données de pagination.
     * @param {number} group_id - L'identifiant du groupe.
     * @returns {string} HTML des boutons.
     */
    generatePaginationButtons(paginationData, group_id) {
        let htmlButtons = "";
        if (paginationData.totalPagesCount > 1) {
            if (paginationData.previousPage > 1) {
                htmlButtons += `<button class="btn btn-primary btn-sm mx-2" onclick="groupAdminManager.getUsersFromGroup(${group_id}, 1)">First Page</button>`;
            }
            if (paginationData.currentPage > 1) {
                htmlButtons += `<button class="btn btn-primary btn-sm mx-2" onclick="groupAdminManager.getUsersFromGroup(${group_id}, ${paginationData.previousPage})">${paginationData.previousPage}</button>`;
            }
            htmlButtons += `<button class="btn btn-primary btn-sm active mx-2">${paginationData.currentPage}</button>`;
            if (paginationData.currentPage < paginationData.totalPagesCount) {
                htmlButtons += `<button class="btn btn-primary btn-sm mx-2" onclick="groupAdminManager.getUsersFromGroup(${group_id}, ${paginationData.nextPage})">${paginationData.nextPage}</button>`;
            }
            if (paginationData.nextPage < paginationData.totalPagesCount) {
                htmlButtons += `<button class="btn btn-primary btn-sm mx-2" onclick="groupAdminManager.getUsersFromGroup(${group_id}, ${paginationData.totalPagesCount})">Last Page - ${paginationData.totalPagesCount}</button>`;
            }
        }
        return htmlButtons;
    }

    /**
     * Génère le HTML pour une ligne utilisateur active.
     * @param {Object} element - Données de l'utilisateur.
     * @returns {string} HTML de la ligne.
     */
    generateActiveUserRow(element) {
        const droits = this.getUserRightsHTML(element);
        const div_img = this.getApplicationsImagesHTML(element);
        return `<tr>
      <td>${element.surname}</td>
      <td>${element.firstname}</td>
      <td>${droits}</td>
      <td>${div_img}</td>
      <td>
        <a class="c-link-primary d-inline-block" href="javascript:void(0)" onclick="resetUserPasswordga(${element.id})" aria-label="Réinitialiser le mot de passe de ${element.firstname} ${element.surname}">
          <i class="fas fa-redo-alt fa-2x" aria-hidden="true"></i>
        </a>
      </td>
      <td>
        <a class="c-link-secondary" href="javascript:void(0)" onclick="showUpdateUserModalGroupAdmin(${element.id})" aria-label="Modifier l'utilisateur ${element.firstname} ${element.surname}">
          <i class="fas fa-pencil-alt fa-2x" aria-hidden="true"></i>
        </a>
      </td>
      <td>
        <button class="btn c-btn-red btn-sm" data-i18n="manager.buttons.disable" onclick="disableUserGroupAdmin(${element.id}, '${element.firstname}')">
          ${i18next.t('manager.buttons.delete')} <i class="fas fa-user-minus"></i>
        </button>
      </td>
    </tr>`;
    }

    /**
     * Génère le HTML pour une ligne utilisateur inactive.
     * @param {Object} element - Données de l'utilisateur.
     * @returns {string} HTML de la ligne.
     */
    generateInactiveUserRow(element) {
        const droits = this.getUserRightsHTML(element);
        const div_img = this.getApplicationsImagesHTML(element);
        return `<tr>
                    <td>${element.surname}</td>
                    <td>${element.firstname}</td>
                    <td>${droits}</td>
                    <td>${div_img}</td>
                    <td>
                        <a class="c-link-primary d-inline-block" href="javascript:void(0)" onclick="resetUserPasswordga(${element.id})" aria-label="Réinitialiser le mot de passe de ${element.firstname} ${element.surname}">
                        <i class="fas fa-redo-alt fa-2x" aria-hidden="true"></i>
                        </a>
                    </td>
                    <td>
                        <a class="c-link-secondary" href="javascript:void(0)" onclick="showUpdateUserModalGroupAdmin(${element.id})" aria-label="Modifier l'utilisateur ${element.firstname} ${element.surname}">
                        <i class="fas fa-pencil-alt fa-2x" aria-hidden="true"></i>
                        </a>
                    </td>
                    <td>
                        <button class="btn c-btn-primary btn-sm" data-i18n="manager.buttons.activate" onclick="activateUserGroupAdmin(${element.id}, '${element.firstname}')">
                        ${i18next.t('manager.buttons.activate')} <i class="fas fa-user-minus"></i>
                        </button>
                        <button class="btn c-btn-red btn-sm" data-i18n="manager.buttons.delete" onclick="deleteUserGroupAdmin(${element.id}, '${element.firstname}')">
                        ${i18next.t('manager.buttons.delete')} <i class="fas fa-user-minus"></i>
                        </button>
                    </td>
                </tr>`;
    }

    /**
     * Vérifie si l'utilisateur est actif.
     * @param {Object} element - Données de l'utilisateur.
     * @returns {boolean}
     */
    isActive(element) {
        // Si la propriété "active" est absente, on considère l'utilisateur comme actif.
        // Sinon, on vérifie si elle vaut 1 (peut être "1" ou 1).
        return !element.hasOwnProperty('active') || element.active == 1;
    }

    /**
     * Retourne le HTML correspondant aux droits de l'utilisateur.
     * @param {Object} element - Données de l'utilisateur.
     * @returns {string} HTML des icônes de droits.
     */
    getUserRightsHTML(element) {
        // Valeur par défaut
        let droits = `<i class="fas fa-question fa-2x" data-bs-toggle="tooltip" data-bs-placement="top" title="${i18next.t('manager.table.userNoRights')}"></i>`;
        if (element.hasOwnProperty('rights')) {
            // On considère l'utilisateur administrateur si rights == 1 (que ce soit un nombre ou une chaîne)
            droits = (element.rights == 1)
                ? `<i class="fas fa-crown fa-2x c-text-gold" data-bs-toggle="tooltip" data-bs-placement="top" title="${i18next.t('manager.table.userAdmin')}"></i>`
                : `<i class="fas fa-user fa-2x c-text-primary" data-bs-toggle="tooltip" data-bs-placement="top" title="${i18next.t('manager.table.userTeacher')}"></i>`;
        }
        return droits;
    }


    /**
     * Retourne le HTML des images des applications.
     * @param {Object} element - Données de l'utilisateur.
     * @returns {string} HTML des images.
     */
    getApplicationsImagesHTML(element) {
        let div_img = "";
        if (element.hasOwnProperty('applicationsFromGroups')) {
            element.applicationsFromGroups.forEach(app => {
                if (app.image && app.image !== "") {
                    div_img += `<img src="${app.image}" data-bs-toggle="tooltip" alt="${app.name}" title="${app.name}" style="max-height: 24px;" class="mx-1">`;
                } else {
                    div_img += `<img src="assets/media/no-app-icon.svg" data-bs-toggle="tooltip" alt="${app.name}" title="${app.name}" style="max-height: 24px;" class="mx-1">`;
                }
            });
        }
        return div_img;
    }

    /**
     * Initialise les tooltips Bootstrap.
     */
    initTooltips() {
        const tooltipTriggerList = Array.from(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.forEach(tooltipTriggerEl => {
            new bootstrap.Tooltip(tooltipTriggerEl);
        });
    }

    globalSearchUser($name, $page, $usersperpage) {
        const process = (res) => {
            mainGroupAdmin.getGroupAdminManager()._allMembersAndTheirGroups = res;
            let $data_table = "",
                $data_table_inactive = "";

            res.forEach(element => {
                if (element.hasOwnProperty('currentPage')) {
                    mainGroupAdmin.getGroupAdminManager()._paginationUsersInfo = element;
                    let name = $('#name_user_search_groupadmin').val(),
                        usersperpage = $('#users_per_page_groupadmin').val(),
                        htmlButtons = "";

                    if (element.totalPagesCount > 1) {
                        if (element.previousPage > 1) {
                            htmlButtons += `<button class="btn btn-primary btn-sm mx-2" onclick="mainGroupAdmin.getGroupAdminManager().globalSearchUser(${name}, 1, ${usersperpage})">First Page</button>`;
                        }
                        if (element.currentPage > 1) {
                            htmlButtons += `<button class="btn btn-primary btn-sm mx-2" onclick="mainGroupAdmin.getGroupAdminManager().globalSearchUser(${name}, ${element.previousPage}, ${usersperpage})">${element.previousPage}</button>`;
                        }
                        htmlButtons += `<button class="btn btn-primary btn-sm active mx-2">${element.currentPage}</button>`;
                        if (element.currentPage < element.totalPagesCount) {
                            htmlButtons += `<button class="btn btn-primary btn-sm mx-2" onclick="mainGroupAdmin.getGroupAdminManager().globalSearchUser(${name}, ${element.nextPage}, ${usersperpage})">${element.nextPage}</button>`;
                        }
                        if (element.nextPage < element.totalPagesCount) {
                            htmlButtons += `<button class="btn btn-primary btn-sm mx-2" onclick="mainGroupAdmin.getGroupAdminManager().globalSearchUser(${name}, ${element.totalPagesCount}, ${usersperpage})">Last Page - ${element.totalPagesCount}</button>`;
                        }
                    }

                    $('#paginationButtons_users_groupadmin').html(htmlButtons);
                } else {
                    let $droits = " <i class='fas fa-question fa-2x' data-bs-toggle='tooltip' data-bs-placement='top' title='" + i18next.t('manager.table.userNoRights') + "'></i>";
                    if (element.hasOwnProperty('rights')) {
                        $droits = element.rights === "1" ? "<i class='fas fa-crown fa-2x c-text-gold' data-bs-toggle='tooltip' data-bs-placement='top' title='" + i18next.t('manager.table.userAdmin') + "' ></i>" :
                            "<i class='fas fa-user fa-2x c-text-primary' data-bs-toggle='tooltip' data-bs-placement='top' title='" + i18next.t('manager.table.userTeacher') + "'></i>";
                    }

                    let div_img = ""
                    if (element.hasOwnProperty('applicationsFromGroups')) {
                        element.applicationsFromGroups.forEach(element_2 => {
                            if (element_2.image != null && element_2.image != "") {
                                div_img += `<img src="${element_2.image}" data-bs-toggle="tooltip" alt="${element_2.name}" title="${element_2.name}" style="max-height: 24px;" class="mx-1">`;
                            } else {
                                div_img += `<img src="assets/media/no-app-icon.svg" data-bs-toggle="tooltip" alt="${element_2.name}" title="${element_2.name}" style="max-height: 24px;" class="mx-1">`;
                            }
                        });
                    }

                    let activeFlag = true;
                    if (element.hasOwnProperty('active')) {
                        if (element.active != "1") {
                            activeFlag = false;
                        }
                    }

                    if (activeFlag) {
                        $data_table += `<tr>
                            <td>${element.surname}</td>
                            <td>${element.firstname}</td>
                            <td>${$droits}</td>
                            <td>${div_img}</td>
                            <td>
                                <a class="c-link-primary d-inline-block" href="javascript:void(0)" onclick="resetUserPasswordga(${element.id})" aria-label="Réinitialiser le mot de passe de ${element.firstname} ${element.surname}">
                                    <i class="fas fa-redo-alt fa-2x" aria-hidden="true"></i>
                                </a>
                            </td>
                            <td>
                                <a class="c-link-secondary" href="javascript:void(0)" onclick="showUpdateUserModalGroupAdmin(${element.id})" aria-label="Modifier l'utilisateur ${element.firstname} ${element.surname}">
                                    <i class="fas fa-pencil-alt fa-2x" aria-hidden="true"></i>
                                </a>
                            </td>
                            <td>
                                <button class="btn c-btn-red btn-sm" data-i18n="manager.buttons.disable" onclick="disableUserGroupAdmin(${element.id}, '${element.firstname}')">${i18next.t('manager.buttons.delete')} <i class="fas fa-user-minus"></i></button>
                            </td>
                        </tr>`;
                    } else {
                        $data_table_inactive += `<tr>
                            <td>${element.surname}</td>
                            <td>${element.firstname}</td>
                            <td>${$droits}</td>
                            <td>${div_img}</td>
                            <td>
                                <a class="c-link-primary d-inline-block" href="javascript:void(0)" onclick="resetUserPasswordga(${element.id})" aria-label="Réinitialiser le mot de passe de ${element.firstname} ${element.surname}">
                                    <i class="fas fa-redo-alt fa-2x" aria-hidden="true"></i>
                                </a>
                            </td>
                            <td>
                                <a class="c-link-secondary" href="javascript:void(0)" onclick="showUpdateUserModalGroupAdmin(${element.id})" aria-label="Modifier l'utilisateur ${element.firstname} ${element.surname}">
                                    <i class="fas fa-pencil-alt fa-2x" aria-hidden="true"></i>
                                </a>
                            </td>
                            <td>
                                <button class="btn c-btn-primary btn-sm" data-i18n="manager.buttons.activate" onclick="activateUserGroupAdmin(${element.id}, '${element.firstname}')">${i18next.t('manager.buttons.activate')} <i class="fas fa-user-minus"></i></button>
                                <button class="btn c-btn-red btn-sm" data-i18n="manager.buttons.delete" onclick="deleteUserGroupAdmin(${element.id}, '${element.firstname}')">${i18next.t('manager.buttons.delete')} <i class="fas fa-user-minus"></i></button>
                            </td>
                        </tr>`;
                    }

                }
            });
            // For active users
            $('#table_info_group_data_groupadmin').html($data_table);
            // For inactive users
            $('#table_info_group_data_groupadmin_inactive').html($data_table_inactive);
            $('[data-bs-toggle="tooltip"]').tooltip()
        }

        $.ajax({
            type: "POST",
            url: "/routing/Routing.php?controller=groupadmin&action=global_search_user_by_name",
            data: {
                name: $name,
                page: $page,
                userspp: $usersperpage,
            },
            success: function (response) {
                process(JSON.parse(response));
            },
            error: function () {
                reject();
            }
        });
    }

    /**
     * 
     * @param {String} $firstname 
     * @param {String} $surname 
     * @param {String} $user_pseudo 
     * @param {String} $phone 
     * @param {String} $mail 
     * @param {String} $bio 
     * @param {Array} $groups 
     * @param {Int} $teacher_grade 
     * @param {Int} $teacher_suject 
     * @param {String} $school 
     * @param {Array} $applications
     * @returns {Json}
     */
    createUserAndLinkToGroup($firstname, $surname, $user_pseudo, $phone, $mail, $bio, $groups, $teacher_grade, $teacher_suject, $school, $application) {
        return new Promise(function (resolve, reject) {
            $.ajax({
                type: "POST",
                url: "/routing/Routing.php?controller=groupadmin&action=create_user",
                data: {
                    groups: JSON.stringify($groups),
                    surname: $surname,
                    firstname: $firstname,
                    pseudo: $user_pseudo,
                    phone: $phone,
                    bio: $bio,
                    grade: $teacher_grade,
                    subject: $teacher_suject,
                    mail: $mail,
                    school: $school,
                    application: JSON.stringify($application)
                },
                success: function (response) {
                    resolve(JSON.parse(response));
                },
                error: function () {
                    reject();
                }
            });
        })
    }

    // Fetch all groups and store them in "_allGroups", then display them in the table
    getAllGroupsInfos($sort, $page, $groupspp) {
        return new Promise(function (resolve, reject) {
            $.ajax({
                type: "POST",
                url: "/routing/Routing.php?controller=groupadmin&action=panel_groups_info",
                data: {
                    sort: $sort,
                    page: $page,
                    groupspp: $groupspp
                },
                success: function (response) {
                    Mainmanager.getmanagerManager()._allGroups = JSON.parse(response);
                    Mainmanager.getmanagerManager().showGroupsInTable((JSON.parse(response)));
                },
                error: function () {
                    reject();
                }
            });
        })
    }

    getApplicationsFromGroup($id) {
        return new Promise(function (resolve, reject) {
            $.ajax({
                type: "POST",
                url: "/routing/Routing.php?controller=groupadmin&action=get_all_applications_from_group",
                data: {
                    id: $id
                },
                success: function (response) {
                    resolve(JSON.parse(response))
                },
                error: function () {
                    reject();
                }
            });
        })
    }

    updateGroup($group_id, $group_name, $group_description, $group_app) {
        return new Promise(function (resolve, reject) {
            $.ajax({
                type: "POST",
                url: "/routing/Routing.php?controller=groupadmin&action=update_group",
                data: {
                    id: $group_id,
                    name: $group_name,
                    description: $group_description,
                    applications: $group_app
                },
                success: function (response) {
                    resolve(JSON.parse(response))
                },
                error: function () {
                    reject();
                }
            });
        })
    }

    disableUser($user_id) {
        return new Promise(function (resolve, reject) {
            $.ajax({
                type: "POST",
                url: "/routing/Routing.php?controller=groupadmin&action=disable_user",
                data: {
                    user_id: $user_id
                },
                success: function (response) {
                    resolve(JSON.parse(response))
                },
                error: function () {
                    reject();
                }
            });
        })
    }


    activateUser($user_id) {
        return new Promise(function (resolve, reject) {
            $.ajax({
                type: "POST",
                url: "/routing/Routing.php?controller=groupadmin&action=activate_user",
                data: {
                    user_id: $user_id
                },
                success: function (response) {
                    resolve(JSON.parse(response))
                },
                error: function () {
                    reject();
                }
            });
        })
    }


    deleteUser($user_id) {
        return new Promise(function (resolve, reject) {
            $.ajax({
                type: "POST",
                url: "/routing/Routing.php?controller=groupadmin&action=delete_user",
                data: {
                    user_id: $user_id
                },
                success: function (response) {
                    resolve(JSON.parse(response))
                },
                error: function () {
                    reject();
                }
            });
        })
    }

    /**
     * Send a password request to the user
     * @param {int} $user_id 
     * @returns 
     */
    sendResetPassword($user_id) {
        return new Promise(function (resolve, reject) {
            $.ajax({
                type: "POST",
                url: "/routing/Routing.php?controller=groupadmin&action=send_request_reset_user_password",
                data: {
                    user_id: $user_id,
                },
                success: function (response) {
                    resolve((JSON.parse(response)));
                },
                error: function () {
                    reject();
                }
            });
        })
    }

    getUserInfoWithHisGroups($user_id) {
        return new Promise(function (resolve, reject) {
            $.ajax({
                type: "POST",
                url: "/routing/Routing.php?controller=groupadmin&action=get_user_info_with_his_groups",
                data: {
                    id: $user_id
                },
                success: function (response) {
                    resolve(JSON.parse(response));
                },
                error: function () {
                    reject();
                }
            });
        })
    }

    updateUser($user_id, $firstname, $surname, $user_pseudo, $phone, $mail, $bio, $groups, $teacher_grade, $teacher_suject, $school, $application) {
        return new Promise(function (resolve, reject) {
            $.ajax({
                type: "POST",
                url: "/routing/Routing.php?controller=groupadmin&action=update_user",
                data: {
                    user_id: $user_id,
                    groups: JSON.stringify($groups),
                    surname: $surname,
                    firstname: $firstname,
                    pseudo: $user_pseudo,
                    phone: $phone,
                    bio: $bio,
                    grade: $teacher_grade,
                    subject: $teacher_suject,
                    mail: $mail,
                    school: $school,
                    application: $application
                },
                success: function (response) {
                    resolve(JSON.parse(response));
                },
                error: function () {
                    reject();
                }
            });
        })
    }

    isGroupFull($group_id) {
        return new Promise(function (resolve, reject) {
            $.ajax({
                type: "POST",
                url: "/routing/Routing.php?controller=groupadmin&action=is_group_full",
                data: {
                    group_id: $group_id
                },
                success: function (response) {
                    resolve(JSON.parse(response));
                },
                error: function () {
                    reject();
                }
            });
        })
    }

    isGroupsApplicationsOutDated($group_id) {
        return new Promise(function (resolve, reject) {
            $.ajax({
                type: "POST",
                url: "/routing/Routing.php?controller=groupadmin&action=is_groups_applications_outdated",
                data: {
                    group_id: $group_id
                },
                success: function (response) {
                    resolve(JSON.parse(response));
                },
                error: function () {
                    reject();
                }
            });
        })
    }

    isUserApplicationsOutDated() {
        return new Promise(function (resolve, reject) {
            $.ajax({
                type: "POST",
                url: "/routing/Routing.php?controller=groupadmin&action=is_teachers_applications_outdated",
                success: function (response) {
                    resolve(JSON.parse(response));
                },
                error: function () {
                    reject();
                }
            });
        })
    }

    getMonitoringGroup($group_id) {
        return new Promise(function (resolve, reject) {
            $.ajax({
                type: "POST",
                url: "/routing/Routing.php?controller=groupadmin&action=group_monitoring",
                data: {
                    group_id: $group_id
                },
                success: function (response) {
                    resolve(JSON.parse(response));
                },
                error: function () {
                    reject();
                }
            });
        })
    }

    helpRequestGroupAdmin(subject, message) {
        return new Promise((resolve, reject) => {
            $.ajax({
                type: 'POST',
                url: '/routing/Routing.php?controller=groupadmin&action=help_request_from_groupadmin',
                data: {
                    'subject': subject,
                    'message': message
                },
                success: function (response) {
                    resolve(JSON.parse(response));
                },
                error: function () {
                    reject();
                }
            });
        });
    }
}