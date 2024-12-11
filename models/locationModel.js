const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  longitude: String,
  latitude: String,
  momentIssue: String,
  description: String,
  url: String,
  heroSectionImage: String, // Single image
  actors: String,
  province: String,
  district: String,
  duration: String,
  momentSubTitle: String,
  momentSlogan: String,
  AboutTitle: String,
  AboutDescription: String,
  AboutImage1: String, // Single image
  AboutImage2: String, // Single image
  issuedDetailTitle: String,
  issuedDetailDescription: String,
  issuedDetailImage1: String, // Single image
  issuedDetailImage2: String, // Single image
  gallery: {
    type: [String], // Array of image filenames
    validate: [arrayLimit, '{PATH} exceeds the limit of 50'], // Validation for max size
  },
});

// Validator function for gallery size
function arrayLimit(val) {
  return val.length <= 50;
}

const Location = mongoose.model('Location', locationSchema);

module.exports = Location;
