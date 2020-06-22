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
 ** TIMER CLASS BEGINS
 **
 **
 **
 **********/

class Timer {

  constructor(dur, label, opts = {
    parent,
    ui,
    theme,
    interval
  }) {
    // Generate a custom ID!
    // ATTACH that ID to the current input.
    this.ID = this.constructor.generateTimerID(this);
    this.opts = {
      ui: opts.ui
    };
    this.label = label ? label : false;
    this.currentTime = 0;
    this.addedTime = 0;
    this.ticker = undefined;
    this.running = false;
    // Create a flag to show if expired or active.
    this.ended = false;
    this.interval = opts.interval ? opts.interval : 500;

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

    if (this.ended || this.running) {
      // The timer has ended or is already running so we should not start it again, reset it first.
      return
    }
    this.running = true;
    this.ticker = setInterval(() => {
      this.currentTime -= this.interval;

      if (this.opts.ui) {
        this.theme.update();
      }

      if (this.currentTime <= 0) {
        this.done();
      }

    }, this.interval);
  }

  reset() {

    clearInterval(this.ticker);
    this.running = false;
    this.ended = false;
    this.currentTime = this.originalSetTime;

    if (this.opts.ui) {
      this.theme.update();
      this.theme.reset();
    }

  }

  pause() {
    clearInterval(this.ticker);
    this.running = false;
  }

  stop() {
    // Stop the countdown
    clearInterval(this.ticker);

    this.ended = true;
    this.running = false;

    if (this.opts.ui && this.TIMERMGMR.opts.cleanUp) {
      // clear up the DOM.
    }
    // Clean up
  }

  done() {
    // Timer finished all the way down to 00:00.
    clearInterval(this.ticker);
    this.ended = true;
    if (this.opts.ui) {
      // if there is an ui trigger the decided UI changes.
      this.theme.done();
      if (this.TIMERMGMR.opts.cleanup) {
        // if the cleanup flag is set then clean up the DOM;
      }
    }
    console.log(this);
  }

  // Increase/Add extra time to the timer.
  add(t) {
    let v = this.constructor.validateStringInput(t);

    if (v) {
      v = this.constructor.parseTimeInput(this.constructor.splitStringInput(t));

      this.addedTime += v;
      this.currentTime += v;
    } else {
      throw `${t} is invalid input!`;
    }
  }

  destroy() {

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

  static defaultTheme(p) {
    return {
      uiTicker: undefined,
      p: p,
      generate() {
        const base = document.createElement('div');
        base.classList.add('backstrip');

        base.addEventListener('click', (e) => {
          this.p.TIMERMGMR.currentTimer = this.p;
        })

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
        let timeTxtWidth = this.timedisplay.getBoundingClientRect().width;
        let barWidth = this.timestrip.getBoundingClientRect().width;

        let str = this.p.constructor.msToMinSecStr(this.p.currentTime);
        this.timedisplay.innerText = str;
        let prcntSize = (this.p.currentTime / (this.p.originalSetTime + this.p.addedTime)) * 100;
        this.timestrip.style.width = `${prcntSize}%`;

        if (prcntSize <= 15) {
          if (this.timedisplay.dataset.hasOwnProperty("inside")) {
            delete this.timedisplay.dataset.inside;
          }
        }

        if (this.p.currentTime % 30000 === 0) {
          console.log("Every thirty seconds");
        }


        // console.log("Text Width: ", timeTxtWidth, "\nBar Width: ", barWidth);
        // if (barWidth <= (timeTxtWidth + 100)) {
        //   if (this.timedisplay.dataset.hasOwnProperty("inside")) {
        //     delete this.timedisplay.dataset.inside;
        //   }
        // }
      },

      reset() {
        if (!this.timedisplay.dataset.hasOwnProperty("inside")) {
          this.timedisplay.dataset.inside = '';
        }
      },

      pause() {

      },

      stop() {

      },

      done() {
        let interval = 150;
        let per = 5000;


        let blink = setInterval(() => {
          this.timedisplay.classList.toggle('blinky');

          per -= interval;

          if (per <= 0) {
            clearInterval(blink);
          }
        }, interval);
      },

      destroy() {
        this.base.parentNode.removeChild(this.base);
      },

      divideTime(ms) {
        return 100 / (ms / 1000);
      }
    }
  }
}

/**********
 *** TIMER CLASS ENDS
 **********/

/*********
 **
 ** TIMERS GROUP CLASS BEGINS
 **
 **
 **
 **********/


class Timers {
  static Timer = Timer;

  constructor(opts = {
    ui: false,
    theme: false,
    inject: String,
    cleanUp: false,
  }) {
    // create Timers group ID
    this.ID = this.constructor.genID(this);
    this.__timers = [];

    if (opts.ui) {
      this.DOMwrap = this.constructor.createDOMCanvas(this.ID);

      let injector = document.querySelectorAll(`.${opts.inject}`)[0];
      injector.insertAdjacentElement('beforeend', this.DOMwrap);
    }
    this.opts = {
      cleanup: opts.cleanUp
    }
    this.currentTimer = undefined;

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

  delete(timer) {
    let index = this.__timers.indexOf(timer)
    if (!timer) {
      timer = this.currentTimer;
    }
    if (timer.opts.ui) {
      timer.theme.destroy();
    }
    this.__timers.splice(index, 1);
    this.__currentTimer = this.__timers[index - 1];

    return;
  }

  add(timer) {
    if (timer instanceof this.constructor.Timer) {
      this.__timers.push(timer);
    } else {
      return false;
    }
  }

  newTimer(dur, label, opts = {
    parent,
    ui,
    theme,
    interval
  }) {
    let timer = new this.constructor.Timer(
      dur, label, opts = {
        parent: this,
        ui: opts.ui,
        theme: opts.theme,
        interval: opts.interval
      }
    )
    this.__timers.push(timer)
    timer = this.__timers[this.__timers.indexOf(timer)]
    this.currentTimer = timer;
    return timer

  }

  timer(tID) {
    return this.__timers[tID];
  }

  get currentTimer() {
    if (!this.__currentTimer) {
      if (this.__timers.length === 1) {
        this.__currentTimer = this.__timers[0];
        return this.__currentTimer;
      }
    } else {
      return this.__currentTimer;
    }
  }

  set currentTimer(t) {
    this.__currentTimer = t;
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

    pause() {

    },

    stop() {
      console.log("TestTheme:Stop");
    },

    destroy() {
      console.log("TestTheme:Destroy");
    }
  }
}
