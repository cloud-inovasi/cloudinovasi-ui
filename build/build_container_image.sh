IMAGE="$1"
ARCH="$2"
PORTAINER_VERSION="$3"
DOCKER_USER="$4"
DOCKER_PASS="$5"
GITHUB_MANIFEST_URL="$6"
APPVEYOR_PULL_REQUEST_NUMBER="$7"

echo "IMAGE: ${IMAGE}"
echo "ARCH: ${ARCH}"
echo "PORTAINER_VERSION: ${PORTAINER_VERSION}"
echo "MANIFEST: ${GITHUB_MANIFEST_URL}"
echo "PR NUMBER: ${APPVEYOR_PULL_REQUEST_NUMBER}"

if [ ! -z "${APPVEYOR_PULL_REQUEST_NUMBER}" ] ; then
  tag="pr${APPVEYOR_PULL_REQUEST_NUMBER}"
  docker build -t "ssbkang/portainer:$tag" -f build/linux/Dockerfile .
  docker login -u "${DOCKER_USER}" -p "${DOCKER_PASS}"
  docker push "ssbkang/portainer:$tag"
  #mkdir -pv portainer
  #cp -r dist/* portainer
  #tar cvpfz "portainer-$PORTAINER_VERSION-$IMAGE-$ARCH.tar.gz" portainer
  #tag="$IMAGE-$ARCH"

  #docker build -t "ssbkang/portainer:$IMAGE-$ARCH-$PORTAINER_VERSION" -f build/linux/Dockerfile .
  #docker tag "ssbkang/portainer:$IMAGE-$ARCH-$PORTAINER_VERSION" "ssbkang/portainer:$IMAGE-$ARCH"
  #docker login -u "$DOCKER_USER" -p "$DOCKER_PASS"
  #docker push "ssbkang/portainer:$IMAGE-$ARCH-$PORTAINER_VERSION"
  #docker push "ssbkang/portainer:$IMAGE-$ARCH"

  #if [ "${2}" == 's390x' ] ; then
  #  wget https://github.com/estesp/manifest-tool/releases/download/v0.8.0/manifest-tool-linux-amd64
  #  git clone -q --branch=master $6 /home/appveyor/projects/docker-manifest

  #  chmod 755 manifest-tool-linux-amd64
    
  #  ./manifest-tool-linux-amd64 push from-spec /home/appveyor/projects/docker-manifest/portainer/portainer-1-19-2.yml
  #  ./manifest-tool-linux-amd64 push from-spec /home/appveyor/projects/docker-manifest/portainer/portainer.yml
  #fi
fi