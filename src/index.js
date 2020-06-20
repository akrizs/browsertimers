const startStopBtn = document.getElementById("startstop");
const resetBtn = document.getElementById("reset");
const timeInput = document.getElementById("timeinp");

/*********
 **
 ** EVENT MIXIN BEGINS
 **
 **
 **
 **********/

const eventMixin = {
  /**
   * Subscribe to event, usage:
   *  menu.on('select', function(item) { ... }
   */
  on(eventName, handler) {
    if (!this._eventHandlers) this._eventHandlers = {};
    if (!this._eventHandlers[eventName]) {
      this._eventHandlers[eventName] = [];
    }
    this._eventHandlers[eventName].push(handler);
  },

  /**
   * Cancel the subscription, usage:
   *  menu.off('select', handler)
   */
  off(eventName, handler) {
    let handlers = this._eventHandlers[eventName];
    if (!handlers) return;
    for (let i = 0; i < handlers.length; i++) {
      if (handlers[i] === handler) {
        handlers.splice(i--, 1);
      }
    }
  },

  /**
   * Generate an event with the given name and data
   *  this.trigger('select', data1, data2);
   */
  trigger(eventName, ...args) {
    if (!this._eventHandlers || !this._eventHandlers[eventName]) {
      return; // no handlers for that event name
    }

    // call the handlers
    this._eventHandlers[eventName].forEach(handler => handler.apply(this, args));
  }
};

/**********
 *** EVENT MIXIN ENDS
 **********/

/*********
 **
 ** TIMERS GROUP CLASS BEGINS
 **
 **
 **
 **********/


class Timers {
  constructor(settings = {
    ui: false,
    inject: String
  }) {
    // create Timers group ID
    this.ID = this.constructor.genID(this);
    this.__timers = [];

    if (settings.ui) {
      this.DOMwrap = this.constructor.createDOMCanvas(this.ID);

      let injector = document.querySelectorAll(`.${settings.inject}`)[0];
      injector.insertAdjacentElement('beforeend', this.DOMwrap);
    }
    // generate all of the events for Other Timers.
    this.on('timer:delete', this.deleteTimer);
    //
  }

  static genID(tg) {
    if (!(tg instanceof this)) {
      throw `${tg} is not an instance of ${this.name}`;
    }
    return Math.random().toString(36).slice(-6);
  }

  static createDOMCanvas(id) {
    const base = document.createElement('div');
    base.classList.add('timers-group', `${id}-group`);
    base.id = `${id}-wrapper`;
    return base;
  }

  deleteTimer(timer) {
    this.__timers.indexOf(timer);
  }

  add(timer) {
    if (timer instanceof Timer) {
      this.__timers.push(timer);
    } else {
      return false;
    }
  }

  timer(tID) {
    return this.__timers[tID];
  }

  get all() {
    return this.__timers;
  }

  get events() {
    return this._eventHandlers;
  }


}

Object.assign(Timers.prototype, eventMixin);

/**********
 *** TIMERS GROUP CLASS ENDS
 **********/

/*********
 **
 ** TIMER CLASS BEGINS
 **
 **
 **
 **********/

class Timer {
  static STD_DURATION = '01:00';
  static STD_TYPE = 'bar';

  // dur = duration of the timer
  // type = what kind of graphical interface to display etc.
  constructor(dur, opts = {
    parent,
    ui,
    theme
  }) {
    // Generate a custom ID!
    // ATTACH that ID to the current input.
    this.ID = this.constructor.generateTimerID(this);
    this.opts = {
      ui: opts.ui
    };
    this.label = '';
    this.currentTime = 0;
    this.ticker = undefined;
    // Create a flag to show if expired or active.
    this.expired = false;

    this.theme = opts.theme ? opts.theme(this) : this.constructor.defaultTheme(this);

    // Validate the dur
    this.valid = this.constructor.validateStringInput(dur);
    // Parse the dur.
    if (this.valid) {
      this.originalSetTime = this.constructor.parseTimeInput(this.constructor.splitStringInput(dur));
    } else {
      return {
        invalid: true,
        start() {
          throw new Exception('Timer invalid!');
        }
      };
    }

    if (parent) {
      this.TIMERMGMR = opts.parent;
      this.TIMERMGMR.__timers.push(this);
    }

    this.currentTime = this.originalSetTime;

    if (opts.ui) {
      // Generate the theme elements.
      this.theme.generate();
      // Inject the theme elements into the DOM.
      this.theme.inject(this.TIMERMGMR.DOMwrap);
      // Initial Update.
      this.theme.update(this.originalSetTime);
    }

    // Link the start button to the timer.
    //this.TIMERMGMR.on('timer:ready', this.ready)
  }

  start() {

    this.ticker = setInterval(() => {
      this.theme.update();

      if (this.currentTime == 0) {
        this.stop();
      }

      this.currentTime -= 1000;


    }, 1000);
  }

  reset() {
    this.currentTime = this.originalSetTime;
  }

  pause() {
    // Grab the currentTime and kill the ticker
  }

  stop() {
    // Stop the countdown
    clearInterval(this.ticker);

    this.expired = true;

    if (this.opts.ui) {

    }
    // Clean up
  }

  done() {
    // Clean up
  }

  add(t) {

  }


  static parseTimeInput([min, sec]) {
    // Take in the string and convert it to MS.
    let totalMs = ((min * 60) * 1000) + (sec * 1000);
    return totalMs;
  }

  static validateStringInput(inp) {
    const RXP_TIMEINPUT = /^\b(\d{0,3})(?:[:,.]{1})([0-5][0-9]{1})$/g;
    return RXP_TIMEINPUT.test(inp);
  }

  static splitStringInput(inp) {
    const RXP_TIMEINPUT = /^\b(\d{0,3})(?:[:,.]{1})([0-5][0-9]{1})$/g;
    return inp.split(RXP_TIMEINPUT).filter(Boolean);
  }

  static msToMinSecStr(ms) {
    let min = Math.floor(ms / 60000);
    let sec = ((ms % 60000) / 1000).toFixed(0);
    return (min < 10 ? '0' : '') + min + ":" + (sec < 10 ? '0' : '') + sec;
  }

  static generateTimerID(timer) {
    if (!(timer instanceof this)) {
      throw `${timer} is not an instance of ${this.name}`;
    }
    return Math.random().toString(36).slice(-8);
  }

  get siblings() {
    return this.TIMERMGMR.all.filter((t) => {
      return t.ID !== this.ID
    });
  }

  static defaultTheme(parent) {
    return {
      p: parent,
      generate() {
        const base = document.createElement('div');
        base.classList.add('backstrip');

        const timestrip = document.createElement('div');
        timestrip.classList.add('timestrip');
        timestrip.id = `${this.p.ID}-timestrip`;

        const timeDisplay = document.createElement('span');
        timeDisplay.id = `${this.p.ID}-dpTime`
        timeDisplay.classList.add('dpTime');
        timeDisplay.dataset.inside = '';
        timeDisplay.innerText = '00:00';

        timestrip.appendChild(timeDisplay);
        base.appendChild(timestrip);
        this.base = base;
        this.timestrip = timestrip;
        this.timedisplay = timeDisplay;
        return
      },

      inject(wrapper) {
        wrapper.appendChild(this.base);
      },

      update() {
        let str = this.p.constructor.msToMinSecStr(this.p.currentTime);
        this.timedisplay.innerText = str;
        let prcntSize = (this.p.currentTime / this.p.originalSetTime) * 100;
        this.timestrip.style.width = `${prcntSize}%`;

        let timeTxtWidth = this.timedisplay.getBoundingClientRect().width;
        let barWidth = this.timestrip.getBoundingClientRect().width;

        if (barWidth <= (timeTxtWidth + 100)) {
          if (this.timedisplay.dataset.hasOwnProperty("inside")) {
            delete this.timedisplay.dataset.inside;
          }
        }
      },

      reset() {

      },

      pause() {

      },

      stop() {

      },

      destroy() {

      },

      divideTime(ms) {
        return 100 / (ms / 1000);
      }
    }
  }
}

Object.assign(Timer.prototype, eventMixin);

/**********
 *** TIMER CLASS ENDS
 **********/

/*********
 **
 ** DOM INTERACTIONS BEGIN
 **
 **
 **
 **********/

const testTheme = () => {
  return {
    generate() {
      console.log("TestTheme:Generate");
    },

    inject() {
      console.log("TestTheme:Inject");
    },

    update() {
      console.log("TestTheme:Update");
    },

    stop() {
      console.log("TestTheme:Stop");
    },

    destroy() {
      console.log("TestTheme:Destroy");
    }
  }
}

window.timers = new Timers(settings = {
  ui: true,
  inject: 'justacenteredwrapper'
});

const timer = new Timer('00:10', options = {
  type: 'bar',
  parent: window.timers,
  ui: true,
  // theme: testTheme
});

const timer22 = new Timer('01:15', options = {
  type: 'bar',
  parent: window.timers,
  ui: true
});

console.log(window.timers);