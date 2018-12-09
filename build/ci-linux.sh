IMAGE="$1"	
ARCH="$2"	
DOCKER_USER="$3"	
DOCKER_PASS="$4"
APPVEYOR_REPO_BRANCH="$5"
APPVEYOR_PULL_REQUEST_NUMBER="$6"

if [ "${APPVEYOR_PULL_REQUEST_NUMBER}" ]; then
  tag="pr${APPVEYOR_PULL_REQUEST_NUMBER}-$IMAGE-$ARCH"
  manifest="pr${APPVEYOR_PULL_REQUEST_NUMBER}"
else
  tag="${APPVEYOR_REPO_BRANCH}-$IMAGE-$ARCH"
  manifest="${APPVEYOR_REPO_BRANCH}"
fi

docker build -t "portainer/portainer:$tag" -f build/linux/Dockerfile .
docker login -u "${DOCKER_USER}" -p "${DOCKER_PASS}"
docker push "portainer/portainer:$tag"

if [ "${2}" == 'amd64' ] ; then
  docker -D manifest create "portainer/portainer:$manifest" \
    "portainer/portainer:$manifest-linux-amd64" \
    "portainer/portainer:$manifest-windows-amd64" \
    "portainer/portainer:$manifest-windows1709-amd64" \
    "portainer/portainer:$manifest-windows1803-amd64"

  docker manifest push "portainer/portainer:$manifest"
fi
