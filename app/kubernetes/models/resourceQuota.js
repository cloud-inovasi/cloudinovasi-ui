import filesizeParser from 'filesize-parser';

export default function KubernetesResourceQuotaViewModel(data) {
  this.Namespace = data.metadata.namespace;
  this.CpuLimit = parseInt(data.spec.hard['limits.cpu']) || 0;
  this.MemoryLimit = filesizeParser(data.spec.hard['limits.memory'], {base: 10}) || 0;
  this.Raw = data;
}

export const KubernetesResourceQuotaDefaults = {
  CpuLimit: 1,
  MemoryLimit: 128 // MB
};