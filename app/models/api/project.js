function ProjectViewModel(data) {
  this.Id = data.Name;
  this.Name = data.Name;

  if (data.Release) {
    this.Release = data.Release
  } else {
    this.Release = "Unknown"
  }

  this.Checked = false;
  if (data.ResourceControl && data.ResourceControl.Id !== 0) {
    this.ResourceControl = new ResourceControlViewModel(data.ResourceControl);
  }
  this.External = data.External;

  if (data.Content) {
    this.Content = data.Content;
  }

  if (data.StackType) {
    this.StackType = data.StackType
  } else {
    this.StackType = "Unknown"
  }
}
