const cloudinary = require("cloudinary")

class Cloudinary {
  constructor(config) {
    cloudinary.config(config)
  }

  upload(base64, to) {
    return new Promise((resolve, reject) =>
      cloudinary.v2.uploader.upload(
        base64,
        {
          resource_type: "raw",
          public_id: to
        },
        (error, result) => {
          error ? reject(error) : resolve(result)
        }
      )
    )
  }
}

module.exports = Cloudinary
