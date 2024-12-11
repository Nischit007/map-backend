const Location = require('../models/locationModel');
const fs = require('fs');
const path = require('path');
const uploadsDir = path.join(__dirname, '../uploads');

const locationService = {
  async createLocation(data, files) {
    const {
      heroSectionImage,
      AboutImage1,
      AboutImage2,
      issuedDetailImage1,
      issuedDetailImage2,
      gallery = [],
      ...rest
    } = data;

    // Create new location with the provided data and file information
    const newLocation = new Location({
      ...rest,
      heroSectionImage: files.heroSectionImage ? files.heroSectionImage[0].filename : null,
      AboutImage1: files.AboutImage1 ? files.AboutImage1[0].filename : null,
      AboutImage2: files.AboutImage2 ? files.AboutImage2[0].filename : null,
      issuedDetailImage1: files.issuedDetailImage1 ? files.issuedDetailImage1[0].filename : null,
      issuedDetailImage2: files.issuedDetailImage2 ? files.issuedDetailImage2[0].filename : null,
      gallery: files.gallery ? files.gallery.map(file => file.filename) : [],
    });

    // Save and return the newly created location
    return await newLocation.save();
  },

  async getAllLocations() {
    return await Location.find();
  },
  async getLocationById(id) {
    try {
      const location = await Location.findById(id);
      if (!location) {
        throw new Error('Location not found');
      }
      return location;
    } catch (error) {
      throw new Error(`Error fetching location: ${error.message}`);
    }
  },

  async updateLocation(id, data, files) {
    const existingLocation = await Location.findById(id);
    if (!existingLocation) throw new Error('Location not found');

    // Update fields with new data
    Object.assign(existingLocation, data);

    // Handle file updates for each specific field
    if (files) {
      const fileFields = ['heroSectionImage', 'AboutImage1', 'AboutImage2', 'issuedDetailImage1', 'issuedDetailImage2', 'gallery'];
      
      for (const field of fileFields) {
        if (files[field]) {
          const oldFilePath = path.join(uploadsDir, existingLocation[field]);
          
          // Delete old file if exists
          if (existingLocation[field] && fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
          }

          // Update the location with the new file
          if (Array.isArray(files[field])) {
            existingLocation[field] = files[field].map(file => file.filename);
          } else {
            existingLocation[field] = files[field][0].filename;
          }
        }
      }
    }

    return await existingLocation.save();
  },

  async deleteLocation(id) {
    const deletedLocation = await Location.findByIdAndDelete(id);
    if (!deletedLocation) throw new Error('Location not found');
    
    // Delete associated files from the file system
    const fileFields = ['heroSectionImage', 'AboutImage1', 'AboutImage2', 'issuedDetailImage1', 'issuedDetailImage2', 'gallery'];

    fileFields.forEach(field => {
      if (deletedLocation[field]) {
        const filePath = path.join(uploadsDir, deletedLocation[field]);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    });

    return deletedLocation;
  }
};

module.exports = locationService;
