const { DataSource } = require("apollo-datasource")
const cloudinary = require("cloudinary")

class Cloudinary extends DataSource {
  constructor(config) {
    super()

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

module.exports = ({ dataSources, config }) => {
  dataSources.push((...args) => ({
    Cloudinary: new Cloudinary(config.cloudinary)
  }))
}
