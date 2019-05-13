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
    if (
      this.subscriptions.find(
        (sub) =>
          sub.aggregateName === aggregateName &&
          sub.aggregateId === aggregateId &&
          sub.service === service &&
          sub.handler === handler
      )
    ) {
      return
    }

    const key = Math.random()
      .toString(36)
      .substr(2, 9)

    this.subscriptions.push({
      key,
      aggregateName,
      aggregateId,
      service,
      handler
    })

    return key
  }

  unsubscribe(key) {
    this.subscriptions = this.subscriptions.filter((sub) => sub.key !== key)
  }
}

export default new Dependencies()
