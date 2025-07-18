<?php

require_once '../bootstrap.php';

use Dotenv\Dotenv;
use Monolog\Logger;
use VittaLogger\Log;
use Utils\Backend\Errors;
use Doctrine\ORM\ORMException;
use Doctrine\DBAL\DBALException;

use User\Controller\ControllerUser;
use User\Entity\UserPremium;

use Doctrine\DBAL\Driver\PDOException;
use Learn\Controller\ControllerCourse;

use Learn\Controller\ControllerLesson;
use Learn\Controller\ControllerChapter;
use Learn\Controller\ControllerComment;


use Learn\Controller\ControllerActivity;
use Learn\Controller\ControllerFavorite;
use Learn\Controller\ControllerCollection;
use Interfaces\Controller\ControllerProject;
use Classroom\Controller\ControllerClassroom;
use Learn\Controller\ControllerNewActivities;



use Utils\Exceptions\EntityOperatorException;
use Classroom\Controller\ControllerGroupAdmin;

use Classroom\Controller\ControllerSuperAdmin;

use Classroom\Controller\ControllerCourseLinkUser;
use Learn\Controller\ControllerCourseLinkCourse;
use Utils\Exceptions\EntityDataIntegrityException;
use Classroom\Controller\ControllerActivityLinkUser;
use Interfaces\Controller\ControllerProjectLinkUser;
use Classroom\Controller\ControllerClassroomLinkUser;
use Utils\Controller\ControllerUpload;

$dotenv = Dotenv::createImmutable(__DIR__ . "/../");
$dotenv->safeLoad();

const OK = "OK";
$controller = isset($_GET['controller']) ? $_GET['controller'] : null;
$action = isset($_GET['action']) ? $_GET['action'] : null;

// Intercept action.
$logPath = isset($_ENV['VS_LOG_PATH']) ? $_ENV['VS_LOG_PATH'] : "/logs/log.log";
$log = Log::createSharedInstance($controller, $logPath, Logger::NOTICE);

try {
    // Get User.
    session_start();
    $user = null;
    if (isset($_SESSION["id"])) {
        $user = $entityManager->getRepository('User\Entity\User')->find(intval($_SESSION["id"]))->jsonSerialize();
        $storedClassroom = $entityManager->getRepository('Classroom\Entity\ClassroomLinkUser')->findBy(['user' => $_SESSION["id"]]);
        if ($storedClassroom) {
            $user["classroom"] = [];
            foreach ($storedClassroom as $classroom) {
                $classroom = $classroom->jsonSerialize();
                $user["classroom"][] = $classroom["classroom"]["id"];
            }
        }
        try {
            $regular = $entityManager->getRepository('User\Entity\Regular')->find(intval($_SESSION["id"]))->jsonSerialize();
            $user['isRegular'] = $regular['email'];
            $user['sso'] = $regular['fromSSO'] ?? false;
            
        } catch (error $e) {
            $user['isRegular'] = false;
        }

        $isFromGar = $entityManager->getRepository('User\Entity\ClassroomUser')
            ->find(intval($_SESSION["id"]));
        if ($isFromGar) {
            $garUser = $isFromGar->jsonSerialize();

            if ($garUser['garId'] != null) {
                $user['isFromGar'] = true;

                if ($garUser['isTeacher'] == true && $garUser['mailTeacher'] == '') {
                    $user['isRegular'] = 'no email provided';
                }
                if ($garUser['isTeacher'] == true && $garUser['mailTeacher'] != '') {
                    $user['isRegular'] = $garUser['mailTeacher'];
                }
            }
        }
    }

    // get and scan the entire plugins folder for PHP files
    $pluginsDir = '../plugins';
    if (is_dir($pluginsDir)) {
        $pluginsFound = array_diff(scandir($pluginsDir), array('..', '.'));

        // scan each single plugin folder
        foreach ($pluginsFound as $singlePlugin) {
            if (!is_dir("../plugins/$singlePlugin")) {
                continue;
            }

            $singlePluginFolders = array_diff(scandir("../plugins/$singlePlugin"), array('..', '.'));

            // convert snake_case from url param into PascalCase to find the right controller file to instanciate
            $ControllerToInstanciate = "Controller" . str_replace('_', '', ucwords($controller, '_'));

            // check if a Controller folder exists in the plugins list
            if (in_array("Controller", $singlePluginFolders)) {
                // check if the required controller file exists and require it 
                if (file_exists("../plugins/$singlePlugin/Controller/$ControllerToInstanciate.php")) {
                    require_once "../plugins/$singlePlugin/Controller/" . $ControllerToInstanciate . ".php";

                    // instanciate the matching controller
                    $class = "Plugins\\$singlePlugin\\Controller\\" . $ControllerToInstanciate;
                    $controller = new $class($entityManager, $user);

                    // return data and exit the foreach loop with a break
                    echo (json_encode($controller->action($action, $_POST)));
                    $log->info($action, OK);
                    exit;
                }
            }
        }
    }

    switch ($controller) {
        case 'user':
            $controller = new ControllerUser($entityManager, $user);
            echo (json_encode($controller->action($action, $_POST)));
            $log->info($action, OK);
            break;
        case 'project':
            $controller = new ControllerProject($entityManager, $user);
            echo (json_encode($controller->action($action, $_POST)));
            $log->info($action, OK);
            break;
        case 'project_link_user':
            $controller = new ControllerProjectLinkUser($entityManager, $user);
            echo (json_encode($controller->action($action, $_POST)));
            $log->info($action, OK);
            break;
        case 'classroom':
            $controller = new ControllerClassroom($entityManager, $user);
            echo (json_encode($controller->action($action, $_POST)));
            $log->info($action, OK);
            break;
        case 'classroom_link_user':
            $controller = new ControllerClassroomLinkUser($entityManager, $user);
            echo (json_encode($controller->action($action, $_POST)));
            $log->info($action, OK);
            break;
        case 'activity_link_user':
            $controller = new ControllerActivityLinkUser($entityManager, $user);
            echo (json_encode($controller->action($action, $_POST)));
            $log->info($action, OK);
            break;
        case 'course':
            $controller = new ControllerCourse($entityManager, $user);
            // handle get and post
            echo (json_encode($controller->action($action, $_POST, true)));
            $log->info($action, OK);
            break;
        case 'collection':
            $controller = new ControllerCollection($entityManager, $user);
            echo (json_encode($controller->action($action, $_POST, true)));
            $log->info($action, OK);
            break;
        case 'activity':
            $controller = new ControllerActivity($entityManager, $user);
            echo (json_encode($controller->action($action, $_POST, true)));
            $log->info($action, OK);
            break;
        case 'chapter':
            $controller = new ControllerChapter($entityManager, $user);
            echo (json_encode($controller->action($action, $_POST, true)));
            $log->info($action, OK);
            break;
        case 'favorite':
            $controller = new ControllerFavorite($entityManager, $user);
            echo (json_encode($controller->action($action, $_POST, true)));
            $log->info($action, OK);
            break;
        case 'comment':
            $controller = new ControllerComment($entityManager, $user);
            echo (json_encode($controller->action($action, $_POST, true)));
            $log->info($action, OK);
            break;
        case 'lesson':
            $controller = new ControllerLesson($entityManager, $user);
            echo (json_encode($controller->action($action, $_POST, true)));
            $log->info($action, OK);
            break;
        case 'tutorial_link_tutorial':
            $controller = new ControllerCourseLinkCourse($entityManager, $user);
            echo (json_encode($controller->action($action, $_POST, true)));
            $log->info($action, OK);
            break;
        case 'session':
            echo (json_encode($user));
            $log->info($action, OK);
            break;
        case 'superadmin':
            $controller = new ControllerSuperAdmin($entityManager, $user);
            echo (json_encode($controller->action($action, $_POST)));
            $log->info($action, OK);
            break;
        case 'groupadmin':
            $controller = new ControllerGroupAdmin($entityManager, $user);
            echo (json_encode($controller->action($action, $_POST)));
            $log->info($action, OK);
            break;
        case 'newActivities':
            $controller = new ControllerNewActivities($entityManager, $user);
            echo (json_encode($controller->action($action, $_POST)));
            $log->info($action, OK);
            break;
        case 'upload':
            $action = lcfirst(str_replace('_', '', ucwords($action, '_')));
            $controllerUpload = new ControllerUpload($entityManager, $user);
            echo json_encode(call_user_func(
                array($controllerUpload, $action)
            ));
            break;
        case 'user_link_course':
            $controller = new ControllerCourseLinkUser($entityManager, $user);
            echo (json_encode($controller->action($action, $_POST)));
            $log->info($action, OK);
            break;
        default:
            $log->warning(null, __FILE__, __LINE__, "Non matched controller");
            break;
    }
} catch (EntityDataIntegrityException $e) {
    $log->error($action, $e->getFile(), $e->getLine(), $e->getMessage());
    echo (json_encode(Errors::createError($e->getMessage())));
} catch (EntityOperatorException $e) {
    $log->error($action, $e->getFile(), $e->getLine(), $e->getMessage());
    echo (json_encode(Errors::createError($e->getMessage())));
} catch (DBALException $e) {
    $log->error($action, $e->getFile(), $e->getLine(), $e->getMessage());
    echo (json_encode(Errors::createError($e->getMessage())));
} catch (PDOException $e) {
    $log->error($action, $e->getFile(), $e->getLine(), $e->getMessage());
    echo (json_encode(Errors::createError($e->getMessage())));
} catch (ORMException $e) {
    $log->error($action, $e->getFile(), $e->getLine(), $e->getMessage());
    echo (json_encode(Errors::createError($e->getMessage())));
} catch (Exception $e) {
    $log->error($action, $e->getFile(), $e->getLine(), $e->getMessage());
    echo (json_encode(Errors::createError($e->getMessage())));
}
