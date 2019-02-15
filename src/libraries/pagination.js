const sift = require("sift").default;

/**
 * Contains helper methods to paginate data with a cursor or with an offset
 *
 * @class Pagination
 */
class Pagination {
  /**
   * Creates an instance of Pagination
   *
   * @param {*} data Data that needs to be paginated
   * @param {number} [limit=10] Data limit per page
   * @memberof Pagination
   */
  constructor(data, limit = 10) {
    this.data = data;
    this.limit = limit;
  }

  /**
   * Get a portion of the data by an offset or a cursor
   *
   * @typedef {Object} Page
   * @property {Number} total Total items of the data
   * @property {Number} limit Max items of the apge
   * @property {Array} data Page data
   * @property {String | Number} cursor Offset or cursor where to start extracting data for the next page
   *
   * @param {String | Number} [offsetOrCursor=""] Exclusive offset or cursor where to start extracting data
   * @returns {Page} A portion of the data between offset or cursor and limit
   * @memberof Pagination
   */
  getPage(offsetOrCursor = "") {
    let toRet = {
      total: this.data.length,
      limit: this.limit,
      data: []
    };

    if (offsetOrCursor.length === 24) {
      const page = this.data
        .filter(sift({ id: { $gt: offsetOrCursor } }))
        .slice(0, this.limit);
      const next = page.slice(-1).pop();

      toRet.cursor = next ? next.id : "";
      toRet.data = page;
    } else {
      const current = parseInt(offsetOrCursor * this.limit);
      const next = current + 1;

      toRet.cursor = next;
      toRet.data = this.data.slice(current).slice(0, this.limit);
    }

    return toRet;
  }
}

module.exports = Pagination;
