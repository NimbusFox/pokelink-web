// const VIEW_TYPE_COUNTER = 'VIEW_TYPE_COUNTER'
// const VIEW_TYPE_GRAVEYARD = 'VIEW_TYPE_GRAVEYARD'
// const VIEW_TYPES = [VIEW_TYPE_COUNTER]
// window.settings.pokeImg.usePath = 'party'

new Vue({
  el: '#deaths',
  data: function () {
    return {
      connected: false,
      loaded: false,
      deaths: [],
      deathCount: 0,
      // types: VIEW_TYPES,
      type: !!params.get('counter') === 'true' ? true : false,
      prefixText: params.get('prefixText') || ''
    };
  },
  created: function () {
    this.loaded = true
  },
  mounted: function () {
    var vm = this;
    let deathsClient = client.setup(settings.port, 'deaths-'+settings.currentUser+'-browser', settings.server, (data) => {
      vm.connected = true;

      this.deaths = this.deaths.map(pokemon => {
        delete pokemon.transformed
        return transformPokemon(pokemon)
      })
    })
      .on('client:players:list', (users) => {
        users.forEach(user => {
          this.updateDeaths(user)
        });
      })
      .on('player:party:death', (payload) => {
        this.addDeath(payload)
      })
      .on('player:party:revive', (payload) => {
        this.revivePokemon(payload)
      })
  },
  methods: {
    addDeath ({event, payload}) {
      if (window.settings.debug) {
        console.log(`Death Update recieved from ${payload.update.username}`)
        console.log(payload)
      }
      if (payload.update.username !== settings.currentUser) return;

      // if (this.deaths.map(pokemon => pokemon.pid).includes(payload.update.death.pid)) return

      let existingDeaths = this.deaths.filter(pokemon => {
        return !(
          pokemon.pid === payload.update.death.pid
          && pokemon.metadata.timeOfDeath === payload.update.death.metadata.timeOfDeath
        )
      })

      this.deaths = [...existingDeaths, transformPokemon(payload.update.death)]
      this.deathCount = this.deaths.length
    },
    updateDeaths (payload) {
      if (window.settings.debug) {
        console.log(`Mass Death Update recieved from ${payload.username}`)
        console.log(payload)
      }
      if (payload.username !== settings.currentUser) return;

      this.deaths = payload.pokedex.dead.map(pokemon => transformPokemon(pokemon))

      try {
        this.deathCount = payload.pokedex.stats.dead
      } catch (e) {}
    },
    revivePokemon ({payload}) {
      if (window.settings.debug) {
        console.log(`Pokemon Revive recieved for ${payload.username}`)
        console.log(payload)
      }

      // remove duplicates

      this.deaths = this.deaths.filter(pokemon => {
        return !(
          pokemon.pid === payload.update.pokemon.pid
          && pokemon.metadata.timeOfDeath === payload.update.pokemon.metadata.timeOfDeath
        )
      })
      this.deathCount = this.deaths.length
    }
  },
  computed: {
    deathsToShow () {
      let graveyardSize = parseInt(params.get('limit'))
      if (isNaN(graveyardSize) || graveyardSize <= 0) return this.deaths

      return this.deaths.reverse().slice(0, graveyardSize)
      // return this.type === VIEW_TYPE_COUNTER
    },
    addCountOffset () {
      let offset = parseInt(params.get('counterOffset'))
      if (isNaN(offset)) return 0
      return offset
    },
    flipped () {
      return !!params.get('flipped')
      // return this.type === VIEW_TYPE_COUNTER
    },
    showCounter () {
      return params.has('counter') && params.get('counter') === 'true'
      // return this.type === VIEW_TYPE_COUNTER
    },
    showGraveyard () {
      return !!params.get('graveyard')
      // return this.type === VIEW_TYPE_COUNTER
    },
    showNames () {
      return params.has('showNames')
      // return this.type === VIEW_TYPE_COUNTER
    },
    scroll () {
      return params.has('scroll')
      // return this.type === VIEW_TYPE_COUNTER
    }
  }
});
