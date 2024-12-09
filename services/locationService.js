const Location = require('../models/locationModel');
const fs = require('fs');
const path = require('path');
const uploadsDir = path.join(__dirname, '../uploads');

const locationService = {
  async createLocation(data, file) {
    const newLocation = new Location({
      ...data,
      file: file ? file.filename : null,
    });
    return await newLocation.save();
  },

  async getAllLocations() {
    return await Location.find();
  },

  async updateLocation(id, data, file) {
    const existingLocation = await Location.findById(id);
    if (!existingLocation) throw new Error('Location not found');

    Object.assign(existingLocation, data); // Update fields with new data

    if (file) {
      if (existingLocation.file) {
        const oldFilePath = path.join(uploadsDir, existingLocation.file);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }
      existingLocation.file = file.filename;
    }

    return await existingLocation.save();
  },

  async deleteLocation(id) {
    const deletedLocation = await Location.findByIdAndDelete(id);
    if (!deletedLocation) throw new Error('Location not found');
    return deletedLocation;
  }
};

module.exports = locationService;
