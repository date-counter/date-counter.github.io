// <date-count> custom element, displaying [years] [days] [hours] [minutes] [seconds] countdown to a date
// counts UP for past dates
// attributes: date, event, count, noyears, nodays, nohours, nominutes, noseconds, locale
// date:    date to count down to, default Y2K38 Epochalypse date Counts UP for past dates
// event:   name of event, default "Y2K38 Epochalypse" OR all HTML specified in lightDOM!
// count:   comma separated list of labels to show, default "years,days,hours,minutes,seconds"
// noyears, nodays, nohours, nominutes, noseconds: hide labels, default show all labels
// locale:  language to use for labels, default "en" (English)

customElements.define("date-count", class extends HTMLElement {

    // ********************************************************************
    connectedCallback() {
        // naming all my variables VAR, they are slightly faster and minify well because CSS has a "var" keyword too
        var count = "years,days,hours,minutes,seconds".split(",");

        // --------------------------------------------------------------------
        // set countlabels any of ["years", "days", "hours", "minutes", "seconds"]
        var countlabels =
            // user defined "years,days"string from attribute "count" 
            this.getAttribute("count")?.split(",")
            // if no "count" attribute specified, use all labels "years,days,hours,minutes,seconds"
            // and filter away user defined "noyears" ... "noseconds" attributes
            || count.filter(label => !this.hasAttribute("no" + label));

        // --------------------------------------------------------------------
        // get proper locale_labels for all countlabels
        var locale_labels = countlabels.map(label =>
            new Intl.RelativeTimeFormat(
                this.getAttribute("format") || "en", // todo: query this default from CSS property?
                //{ numeric: "auto" }
            ).formatToParts(
                2, // 2 for plural, 1 for singular
                label // label in "years,days,hours,minutes,seconds"
            )[2] // get time label name in locale as Object
                .value // get time name in locale as String
        );

        // ********************************************************************
        // generic function to create a HTML element with all content and properties
        // this[id] optimized for use in this Custom Element
        var element = ({
            create = "div", // default element is a <div>
            id,// 
            append = [],// append array of child elements 
            ...p // all remaing props
        }) => (
            // I hate "return" statements they only take up bytes (x,y,z,return value) does the job

            // every id must be unique! and becomes a this. reference
            this[id] = Object.assign( // Object.assign is my favorite JS function
                document.createElement(create), // create a DOM element
                { id, part: id, ...p } // set ALL properties, eventhandlers etc.
            ),
            this[id].append(...append), // append all child elements
            /* Return value: */ this[id]
        );
        // ********************************************************************
        // generic function setting CSS selector
        // to read value from attribues OR CSS property OR default value
        var attr_CSSprop = (prefix, name, value) =>
            `${name}:${this.getAttribute(prefix + `-` + name) ||
            `var(--date-count-${prefix}-${name},${value})`};`;

        // ********************************************************************
        // create full shadowDOM
        this.attachShadow({ mode: "open" }).append(
            // ----------------------------------------------------------------
            element({
                create: "style",
                //id: "style", // prevent from setting default "undefined" string value
                innerHTML: ":host{display:inline-block;" +
                    attr_CSSprop("", "font", "arial") +
                    attr_CSSprop("", "width", "", countlabels.length * 5 + "rem") +
                    "}" +
                    // eventname
                    "#event{" +
                    attr_CSSprop("event", "color", "#000") + // black
                    attr_CSSprop("event", "padding", "0 1rem") +
                    attr_CSSprop("event", "font-size", "2.5rem") +
                    attr_CSSprop("event", "text-align", "center") +
                    attr_CSSprop("event", "background", "#fc0") + // gold
                    "}" +
                    // countdown counters
                    "#counts{display:grid;grid:1fr/repeat(" + countlabels.length + ",1fr);" +
                    //"grid-auto-flow:row;" +
                    attr_CSSprop("counts", "color", "#fff") + // white
                    attr_CSSprop("counts", "font-size", "2.5rem") +
                    attr_CSSprop("counts", "text-align", "center") +
                    attr_CSSprop("counts", "background", "#080") + // green
                    "}" +
                    // countdown labels
                    "[part*='label']{" +
                    attr_CSSprop("label", "padding", "0 1rem") +
                    attr_CSSprop("label", "font-size", "50%") +
                    attr_CSSprop("label", "text-transform", "uppercase") +
                    "}"
            }),
            // --------------------------------------------------------------------
            element({
                id: "event",
                //innerHTML: "<slot>" + (this.getAttribute("event") || "Y2K38 Epochalypse") + "</slot>",
                // using append creates a 3 bytes smaller GZip file
                append: [
                    element({ create: "slot", innerHTML: this.getAttribute("event") || "Y2K38 Epochalypse" })
                ]
            }),
            // --------------------------------------------------------------------
            element({
                id: "counts",
                append: countlabels.map(id => element({ // id = "years", "days", "hours", "minutes", "seconds"
                    id: id + "part",
                    append: [
                        element({
                            id
                            //, innerHTML: "#" // saving some bytes, after a second the value will be set
                        }),
                        element({
                            id: id + "label",
                            innerHTML: locale_labels[countlabels.indexOf(id)]
                        })]
                }))
            }))// shadowDOM created

        // ----------------------------------------------------------------
        // main interval timer
        // Hey! Its JavaScript! Reusing count variable, so we don't have to declare a new one! Now for a timer function
        count = setInterval(() => {
            var datedifference = this.counts(new Date(this.getAttribute("date") || "2038-01-19 03:14:07"));
            if (countlabels.map(label =>
            (
                this.setAttribute(label, datedifference[label]),
                // update every counter in the DOM element this[label]
                /*.map RETURN value: */ this[label].innerHTML = datedifference[label]
                // OR minimal DOM updates; update only counters that are not 0 OR the same value as before
                //(this["_" + label] == datedifference[label]) && (this[label].innerHTML = (this["_" + label] = datedifference[label]))
            )).every(value => !value)) {
                // counter is down to 0, stop interval timer
                clearInterval(count);
                this.dispatchEvent(new CustomEvent("date-count", { bubbles: 1, composed: 1 })); // dispatch event
            }
        }, 1e3);// ping every second

    } // connectedCallback

    // ********************************************************************
    // keeping as separate methode for easy reuse in other projects
    // could be included in this connectedCallback setInterval for a smaller file
    counts(date, start = new Date(), future = new Date(date)) {
        var since = future < start && ([start, future] = [future, start]);
        var diff = future - start;
        var day = 864e5;
        var timediff = { years: ~~(diff / (day * 365)) };
        var leapYears = 0;
        var i;
        for (i = start.getFullYear(); i < future.getFullYear(); i++)
            ((i % 4 == 0 && i % 100 != 0) || i % 400 == 0) && (since ? leapYears-- : leapYears++);
        //timediff.weeks = ~~((diff -= timediff.years * day * 7)/day);
        timediff.days = ~~((diff -= timediff.years * day * 365) / day) + leapYears;
        timediff.hours = ~~((diff -= (timediff.days - leapYears) * day) / 36e5);
        timediff.minutes = ~~((diff -= timediff.hours * 36e5) / (6e4));
        timediff.seconds = ~~((diff -= timediff.minutes * 6e4) / 1e3);
        return timediff;
    }
})