package proxy

import "github.com/portainer/portainer"

// filterVolumeList loops through all volumes, filters volumes without any resource control (public resources) or with
// any resource control giving access to the user (these volumes will be decorated).
// Volume object schema reference: https://docs.docker.com/engine/api/v1.28/#operation/VolumeList
func filterVolumeList(volumeData []interface{}, resourceControls []portainer.ResourceControl, userID portainer.UserID, userTeamIDs []portainer.TeamID) ([]interface{}, error) {
	filteredVolumeData := make([]interface{}, 0)

	for _, volume := range volumeData {
		volumeObject := volume.(map[string]interface{})
		if volumeObject[volumeIdentifier] == nil {
			return nil, ErrDockerVolumeIdentifierNotFound
		}

		volumeID := volumeObject[volumeIdentifier].(string)
		resourceControl := getResourceControlByResourceID(volumeID, resourceControls)
		if resourceControl == nil {
			filteredVolumeData = append(filteredVolumeData, volumeObject)
		} else if resourceControl != nil && canUserAccessResource(userID, userTeamIDs, resourceControl) {
			volumeObject = decorateObject(volumeObject, resourceControl)
			filteredVolumeData = append(filteredVolumeData, volumeObject)
		}
	}

	return filteredVolumeData, nil
}

// filterContainerList loops through all containers, filters containers without any resource control (public resources) or with
// any resource control giving access to the user (check on container ID and optional Swarm service ID, these containers will be decorated).
// Container object schema reference: https://docs.docker.com/engine/api/v1.28/#operation/ContainerList
func filterContainerList(containerData []interface{}, resourceControls []portainer.ResourceControl, userID portainer.UserID, userTeamIDs []portainer.TeamID) ([]interface{}, error) {
	filteredContainerData := make([]interface{}, 0)

	for _, container := range containerData {
		containerObject := container.(map[string]interface{})
		if containerObject[containerIdentifier] == nil {
			return nil, ErrDockerContainerIdentifierNotFound
		}

		containerID := containerObject[containerIdentifier].(string)
		resourceControl := getResourceControlByResourceID(containerID, resourceControls)
		if resourceControl == nil {
			// check if container is part of a Swarm service
			containerLabels := extractContainerLabelsFromContainerListObject(containerObject)
			if containerLabels != nil && containerLabels[containerLabelForServiceIdentifier] != nil {
				serviceID := containerLabels[containerLabelForServiceIdentifier].(string)
				serviceResourceControl := getResourceControlByResourceID(serviceID, resourceControls)
				if serviceResourceControl == nil {
					filteredContainerData = append(filteredContainerData, containerObject)
				} else if serviceResourceControl != nil && canUserAccessResource(userID, userTeamIDs, serviceResourceControl) {
					containerObject = decorateObject(containerObject, serviceResourceControl)
					filteredContainerData = append(filteredContainerData, containerObject)
				}
			} else {
				filteredContainerData = append(filteredContainerData, containerObject)
			}
		} else if resourceControl != nil && canUserAccessResource(userID, userTeamIDs, resourceControl) {
			containerObject = decorateObject(containerObject, resourceControl)
			filteredContainerData = append(filteredContainerData, containerObject)
		}
	}

	return filteredContainerData, nil
}

// filterContainersWithLabels loops through a list of containers, and filters containers that do not contains
// any labels in the labels black list.
func filterContainersWithBlackListedLabels(containerData []interface{}, labelBlackList []portainer.Pair) ([]interface{}, error) {
	filteredContainerData := make([]interface{}, 0)

	for _, container := range containerData {
		containerObject := container.(map[string]interface{})

		containerLabels := extractContainerLabelsFromContainerListObject(containerObject)
		if containerLabels != nil {
			if !containerHasBlackListedLabel(containerLabels, labelBlackList) {
				filteredContainerData = append(filteredContainerData, containerObject)
			}
		} else {
			filteredContainerData = append(filteredContainerData, containerObject)
		}
	}

	return filteredContainerData, nil
}

// filterServiceList loops through all services, filters services without any resource control (public resources) or with
// any resource control giving access to the user (these services will be decorated).
// Service object schema reference: https://docs.docker.com/engine/api/v1.28/#operation/ServiceList
func filterServiceList(serviceData []interface{}, resourceControls []portainer.ResourceControl, userID portainer.UserID, userTeamIDs []portainer.TeamID) ([]interface{}, error) {
	filteredServiceData := make([]interface{}, 0)

	for _, service := range serviceData {
		serviceObject := service.(map[string]interface{})
		if serviceObject[serviceIdentifier] == nil {
			return nil, ErrDockerServiceIdentifierNotFound
		}

		serviceID := serviceObject[serviceIdentifier].(string)
		resourceControl := getResourceControlByResourceID(serviceID, resourceControls)
		if resourceControl == nil {
			filteredServiceData = append(filteredServiceData, serviceObject)
		} else if resourceControl != nil && canUserAccessResource(userID, userTeamIDs, resourceControl) {
			serviceObject = decorateObject(serviceObject, resourceControl)
			filteredServiceData = append(filteredServiceData, serviceObject)
		}
	}

	return filteredServiceData, nil
}

// filterNetworkList loops through all networks, filters networks without any resource control (public resources) or with
// any resource control giving access to the user (these networks will be decorated).
// Network object schema reference: https://docs.docker.com/engine/api/v1.28/#operation/NetworkList
func filterNetworkList(networkData []interface{}, resourceControls []portainer.ResourceControl, userID portainer.UserID, userTeamIDs []portainer.TeamID) ([]interface{}, error) {
	filteredNetworkData := make([]interface{}, 0)

	for _, network := range networkData {
		networkObject := network.(map[string]interface{})
		if networkObject[networkIdentifier] == nil {
			return nil, ErrDockerNetworkIdentifierNotFound
		}

		networkID := networkObject[networkIdentifier].(string)
		resourceControl := getResourceControlByResourceID(networkID, resourceControls)
		if resourceControl == nil {
			filteredNetworkData = append(filteredNetworkData, networkObject)
		} else if resourceControl != nil && canUserAccessResource(userID, userTeamIDs, resourceControl) {
			networkObject = decorateObject(networkObject, resourceControl)
			filteredNetworkData = append(filteredNetworkData, networkObject)
		}
	}

	return filteredNetworkData, nil
}

// filterSecretList loops through all secrets, filters secrets without any resource control (public resources) or with
// any resource control giving access to the user (these secrets will be decorated).
// Secret object schema reference: https://docs.docker.com/engine/api/v1.28/#operation/SecretList
func filterSecretList(secretData []interface{}, resourceControls []portainer.ResourceControl, userID portainer.UserID, userTeamIDs []portainer.TeamID) ([]interface{}, error) {
	filteredSecretData := make([]interface{}, 0)

	for _, secret := range secretData {
		secretObject := secret.(map[string]interface{})
		if secretObject[secretIdentifier] == nil {
			return nil, ErrDockerSecretIdentifierNotFound
		}

		secretID := secretObject[secretIdentifier].(string)
		resourceControl := getResourceControlByResourceID(secretID, resourceControls)
		if resourceControl == nil {
			filteredSecretData = append(filteredSecretData, secretObject)
		} else if resourceControl != nil && canUserAccessResource(userID, userTeamIDs, resourceControl) {
			secretObject = decorateObject(secretObject, resourceControl)
			filteredSecretData = append(filteredSecretData, secretObject)
		}
	}

	return filteredSecretData, nil
}

// filterTaskList loops through all tasks, filters tasks without any resource control (public resources) or with
// any resource control giving access to the user based on the associated service identifier.
// Task object schema reference: https://docs.docker.com/engine/api/v1.28/#operation/TaskList
func filterTaskList(taskData []interface{}, resourceControls []portainer.ResourceControl, userID portainer.UserID, userTeamIDs []portainer.TeamID) ([]interface{}, error) {
	filteredTaskData := make([]interface{}, 0)

	for _, task := range taskData {
		taskObject := task.(map[string]interface{})
		if taskObject[taskServiceIdentifier] == nil {
			return nil, ErrDockerTaskServiceIdentifierNotFound
		}

		serviceID := taskObject[taskServiceIdentifier].(string)

		resourceControl := getResourceControlByResourceID(serviceID, resourceControls)
		if resourceControl == nil || (resourceControl != nil && canUserAccessResource(userID, userTeamIDs, resourceControl)) {
			filteredTaskData = append(filteredTaskData, taskObject)
		}
	}

	return filteredTaskData, nil
}
