angular
  .module 'rentswatchApi'
    .constant 'settings',
      # Available currencies
      CURRENCIES:
        EUR:
          CONVERSION_RATE: 1
          TICK: 200
          DEMO_GROWTH: 400
          DEMO_RENT: 200
        # CHF:
        #   CONVERSION_RATE: 1.08467
        #   TICK: 220
        #   DEMO_GROWTH: 500
        #   DEMO_RENT: 300
        # PLN:
        #   CONVERSION_RATE: 4.30715
        #   TICK: 800
        #   DEMO_GROWTH: 1000
        #   DEMO_RENT: 1000
      DEFAULT_CURRENCY: 'EUR'
