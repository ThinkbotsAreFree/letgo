


function Letgo() {

    this.handlers = [];
    this.watchers = [];
    this.feedloop = [];
    this.varboard = {};
}



Letgo.prototype.access = function(access) {
    
    var self = this;
    return function(varname, value) {
        self.signal(access, varname, value);
        return (arguments.length > 1) ?
            self.varboard[varname] = value :
            self.varboard[varname];
    }
}



Letgo.prototype.signal = function(access, varname, value) {
    
    for (let watcher of this.watchers)
        if (watcher.active && watcher.pattern.test(access))
            this.feed(watcher.execute(access, varname, value), watcher);
}



Letgo.prototype.errorless = function(procedure) {
    
    return function() {
        try { return procedure.apply(this, arguments); }
        catch(e) { return { error: e }; }
    }
}



Letgo.prototype.watcher = function(select, execute, tagline, priority) {

    let procedure = this.errorless(execute);
    let unit = {
        type: this.watchers,
        pattern: select instanceof RegExp ? select : new RegExp(select),
        execute: procedure,
        tagline: tagline || '',
        active: true,
        priority: priority
    };
    this.watchers.push(unit);
    return unit;
}



Letgo.prototype.handler = function(context, execute, tagline, priority) {

    let procedure = this.errorless(execute);
    let unit = {
        type: this.handlers,
        context: context,
        execute: procedure,
        tagline: tagline || '',
        active: true,
        priority: priority
    };
    this.handlers.push(unit);
    return unit;
}



Letgo.prototype.each = function(select, procedure) {
    
    let result = [];
    let pattern = select instanceof RegExp ? select : new RegExp(select);
    for (let category of [this.watchers, this.handlers])
        for (let unit of category)
            if (pattern.test(unit.tagline))
                result.push(procedure.call(this, unit));
    return result;
}



Letgo.prototype.enable = function(select) {
    
    this.each(select, unit => unit.active = true);
}



Letgo.prototype.disable = function(select) {
    
    this.each(select, unit => unit.active = false);
}



Letgo.prototype.inject = function(input) {

    for (let handler of this.handlers)
        if (handler.active && this.match(input, handler.context)) 
            this.feed(handler.execute(input), handler);
}



Letgo.prototype.feed = function(output, origin) {
    
    if (output) this.feedloop.push(
        Object.assign({
            priority: origin.priority,
            timestamp: Date.now(),
            origin: origin
        }, output)
    );
}



Letgo.prototype.match = function(input, matcher) {

    for (let key in matcher)
        if (!matcher[key](key == "input" ? input : input[key]))
            return false;
    return true;
}



Letgo.prototype.run = function(interval) {
    
    if (this.feedloop.length) {
        let start = Date.now();
        this.inject(this.feedloop.shift());
        this.feedloop.sort((a, b) => b.priority - a.priority);
        if (arguments.length) setTimeout(
            () => this.run(interval),
            Math.max(0, interval - (Date.now() - start))
        );
    }
}










let lg = new Letgo();

lg.watcher("foo.*", (a, n, v) => {
   
   console.log("action: "+a);
   console.log("varname: "+n);
   console.log("value: "+v);

}, "typical tags");

lg.handler({ t: v => v == "ok" }, (c) => {
    
    console.log("[ok]", c.content);
    lg.access("football")("but", 30);
    
   return {
       t: "ok",
       content: Date.now().toString()
   };
});

lg.handler({ input: input => "error" in input }, (context) => {
    
    console.warn("[context.error]", context.error);
})

//lg.disable(".*ica.*");

lg.inject({ t: "ok", content: "woow" });

lg.run(1000);
















