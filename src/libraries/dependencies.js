class Dependencies {
  constructor() {
    this.subscriptions = []
  }

  emit(aggregateName, aggregateId, context) {
    this.subscriptions
      .filter(
        ({ aggregateName: aName, aggregateId: aId }) =>
          aName === aggregateName && aId === aggregateId
      )
      .forEach(({ aggregateId, service, handler }) => {
        context.dataSources[service].commit(handler, aggregateId, null)
      })
  }

  subscribe(aggregateName, aggregateId, service, handler) {
    this.subscriptions.push({
      aggregateName,
      aggregateId,
      service,
      handler
    })
  }
}

export default new Dependencies()
