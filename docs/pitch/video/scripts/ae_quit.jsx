// Saves the open project (if it has a file) and quits After Effects.
(function () {
  try {
    if (app.project.file) app.project.save();
  } catch (e) {}
  app.quit();
})();
