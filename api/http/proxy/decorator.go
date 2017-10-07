package proxy

import "github.com/portainer/portainer"

// decorateVolumeList loops through all volumes and will decorate any volume with an existing resource control.
// Volume object schema reference: https://docs.docker.com/engine/api/v1.28/#operation/VolumeList
func decorateVolumeList(volumeData []interface{}, resourceControls []portainer.ResourceControl) ([]interface{}, error) {
	decoratedVolumeData := make([]interface{}, 0)

	for _, volume := range volumeData {

		volumeObject := volume.(map[string]interface{})
		if volumeObject[volumeIdentifier] == nil {
			return nil, ErrDockerVolumeIdentifierNotFound
		}

		volumeID := volumeObject[volumeIdentifier].(string)
		resourceControl := getResourceControlByResourceID(volumeID, resourceControls)
		if resourceControl != nil {
			volumeObject = decorateObject(volumeObject, resourceControl)
		}
		decoratedVolumeData = append(decoratedVolumeData, volumeObject)
	}

	return decoratedVolumeData, nil
}

// decorateContainerList loops through all containers and will decorate any container with an existing resource control.
// Check is based on the container ID and optional Swarm service ID.
// Container object schema reference: https://docs.docker.com/engine/api/v1.28/#operation/ContainerList
func decorateContainerList(containerData []interface{}, resourceControls []portainer.ResourceControl) ([]interface{}, error) {
	decoratedContainerData := make([]interface{}, 0)

	for _, container := range containerData {

		containerObject := container.(map[string]interface{})
		if containerObject[containerIdentifier] == nil {
			return nil, ErrDockerContainerIdentifierNotFound
		}

		containerID := containerObject[containerIdentifier].(string)
		resourceControl := getResourceControlByResourceID(containerID, resourceControls)
		if resourceControl != nil {
			containerObject = decorateObject(containerObject, resourceControl)
		}

		containerLabels := extractContainerLabelsFromContainerListObject(containerObject)
		if containerLabels != nil && containerLabels[containerLabelForServiceIdentifier] != nil {
			serviceID := containerLabels[containerLabelForServiceIdentifier].(string)
			resourceControl := getResourceControlByResourceID(serviceID, resourceControls)
			if resourceControl != nil {
				containerObject = decorateObject(containerObject, resourceControl)
			}
		}

		decoratedContainerData = append(decoratedContainerData, containerObject)
	}

	return decoratedContainerData, nil
}

// decorateServiceList loops through all services and will decorate any service with an existing resource control.
// Service object schema reference: https://docs.docker.com/engine/api/v1.28/#operation/ServiceList
func decorateServiceList(serviceData []interface{}, resourceControls []portainer.ResourceControl) ([]interface{}, error) {
	decoratedServiceData := make([]interface{}, 0)

	for _, service := range serviceData {

		serviceObject := service.(map[string]interface{})
		if serviceObject[serviceIdentifier] == nil {
			return nil, ErrDockerServiceIdentifierNotFound
		}

		serviceID := serviceObject[serviceIdentifier].(string)
		resourceControl := getResourceControlByResourceID(serviceID, resourceControls)
		if resourceControl != nil {
			serviceObject = decorateObject(serviceObject, resourceControl)
		}
		decoratedServiceData = append(decoratedServiceData, serviceObject)
	}

	return decoratedServiceData, nil
}

// decorateNetworkList loops through all networks and will decorate any network with an existing resource control.
// Network object schema reference: https://docs.docker.com/engine/api/v1.28/#operation/NetworkList
func decorateNetworkList(networkData []interface{}, resourceControls []portainer.ResourceControl) ([]interface{}, error) {
	decoratedNetworkData := make([]interface{}, 0)

	for _, network := range networkData {

		networkObject := network.(map[string]interface{})
		if networkObject[networkIdentifier] == nil {
			return nil, ErrDockerNetworkIdentifierNotFound
		}

		networkID := networkObject[networkIdentifier].(string)
		resourceControl := getResourceControlByResourceID(networkID, resourceControls)
		if resourceControl != nil {
			networkObject = decorateObject(networkObject, resourceControl)
		}

		decoratedNetworkData = append(decoratedNetworkData, networkObject)
	}

	return decoratedNetworkData, nil
}

// decorateSecretList loops through all secrets and will decorate any secret with an existing resource control.
// Secret object schema reference: https://docs.docker.com/engine/api/v1.28/#operation/SecretList
func decorateSecretList(secretData []interface{}, resourceControls []portainer.ResourceControl) ([]interface{}, error) {
	decoratedSecretData := make([]interface{}, 0)

	for _, secret := range secretData {

		secretObject := secret.(map[string]interface{})
		if secretObject[secretIdentifier] == nil {
			return nil, ErrDockerSecretIdentifierNotFound
		}

		secretID := secretObject[secretIdentifier].(string)
		resourceControl := getResourceControlByResourceID(secretID, resourceControls)
		if resourceControl != nil {
			secretObject = decorateObject(secretObject, resourceControl)
		}

		decoratedSecretData = append(decoratedSecretData, secretObject)
	}

	return decoratedSecretData, nil
}

func decorateObject(object map[string]interface{}, resourceControl *portainer.ResourceControl) map[string]interface{} {
	metadata := make(map[string]interface{})
	metadata["ResourceControl"] = resourceControl
	object["Portainer"] = metadata
	return object
}
