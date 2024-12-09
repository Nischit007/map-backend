const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  longitude: String,
  latitude: String,
  momentIssue: String,
  description: String,
  url: String,
  file: String,
  actors: String,
  province: String,
  district: String,
});

const Location = mongoose.model('Location', locationSchema);

module.exports = Location;
