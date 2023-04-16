
customElements.define("date-counter", class extends HTMLElement {
    get date() {
        // get date from attribute or default Y2K38 Epochalypse date
        return new Date(this.getAttribute("date") || "2038-01-19 03:14:07");
    }
    get eventname() {
        // get event name from attribute or default Y2K38 Epochalypse name
        return this.getAttribute("event") || "Y2K38 Epochalypse <a href=//en.wikipedia.org/wiki/Y2K38 style=font-size:40%>wtf?</a>";
    }
    connectedCallback(
        // naming all my variables VAR, they are slight faster and minify well because CSS has a "var" keyword too
        count = ["years", "days", "hours", "minutes", "seconds"],

        // set counting years,days,hours,minutes,seconds
        countlabels =
            // user defined "years,days"string from attribute "count" 
            this.getAttribute("count")?.split(",")
            // or default "years,days,hours,minutes,seconds":
            // filter away user defined "noXXXX" attributes
            || count.filter(label => !this.hasAttribute("no" + label)),

        // init labels to be shown
        locale_labels =
            // get proper langauge names for all counting labels
            count.map(
                label => (new Intl.RelativeTimeFormat((this.getAttribute("locale") || "en"), { numeric: "auto" }))
                    .formatToParts(10, label)[2].value.trim()
            ),

        // generic function to create a HTML element with all content and properties
        element = ({ tag = "div", id, append = [], ...props }) => {
            // every id must be unique! and becomes a this. reference
            this[id] = Object.assign(document.createElement(tag), { id, ...props });
            this[id].append(...append);
            return this[this[id].part = id]; // merged 2 JS lines into one for shorter code
        },
        // generic function setting CSS selector
        // to read value from attribues OR CSS property OR default value
        attr_CSSprop = (prefix, name, value, // parameters
            // abusing parameters as variable declarations to avoid needing a function body and "return" statement
            attr = `${prefix}-${name}`, // eg. event-background
            cssprop = `--${this.localName}-${attr}`, // eg. --date-counter-event-background
            //            l = console.log(attr, this.getAttribute(attr))
        ) => `${name}:${this.getAttribute(attr) || `var(${cssprop},${value})`};`,

        // declare here to prevent needing let inside code below
        timer, datedifference

    ) {
        // create full shadowDOM
        this.attachShadow({ mode: "open" }).append(
            element({
                tag: "style",
                //id: "style", // prevent from setting default "undefined" string value
                innerHTML: `:host {display:inline-block;` +
                    attr_CSSprop("", "font-family", "arial") +
                    attr_CSSprop("", "width", "", countlabels.length * 5 + "rem") +
                    `}` +
                    `#event{` +
                    attr_CSSprop("event", "padding", "0 1rem") +
                    attr_CSSprop("event", "background", "gold") +
                    attr_CSSprop("event", "color", "black") +
                    attr_CSSprop("event", "text-align", "center") +
                    attr_CSSprop("event", "font-size", "2.5rem") +
                    `}` +
                    `#counters{display:grid;grid:1fr/repeat(${countlabels.length},1fr);` +
                    `grid-auto-flow:row;` +
                    attr_CSSprop("counters", "background", "green") +
                    attr_CSSprop("counters", "color", "white") +
                    attr_CSSprop("counters", "text-align", "center") +
                    attr_CSSprop("counters", "font-size", "2.5rem") +
                    `}` +
                    `[part*="label"]{` +
                    attr_CSSprop("label", "padding", "0 1rem") +
                    attr_CSSprop("label", "font-size", ".5em") +
                    attr_CSSprop("label", "text-transform", "uppercase") +
                    `}`
            }),
            element({
                id: "event",
                innerHTML: `<slot>${this.eventname}</slot>`
            }),
            element({
                id: "counters",
                append: countlabels.map(id => element({
                    id: id + "date",
                    append: [
                        element({ id, innerHTML: "0" }), // "days", "hours", "minutes", "seconds"
                        element({
                            id: id + "label",
                            innerHTML: (
                                // shorten the default years,days,hours,minutes,seconds to the number of user-defined labels
                                count.reduce((acc, label, idx) => (// (X,acc) notation for shorter code
                                    countlabels.includes(label) && acc.push(locale_labels[idx]),
                                    acc // return accumulator
                                ), [])
                                // now from shorted array of labels, get the label for this id
                                [countlabels.indexOf(id)] || "")
                        })]
                }))
            }))// shadowDOM created

        // main interval timer
        timer = setInterval(() => {
            datedifference = this.difference(this.date);
            countlabels.map(label => (this["_" + label] == datedifference[label])
                ? 0
                : this[label].innerHTML = (this["_" + label] = datedifference[label])); // update counter
            if (countlabels.every(label => datedifference[label] == 0)) clearInterval(timer);
        }, 1e3);

    } // connectedCallback

    // keeping as separate methode for easy reuse in other projects
    // could be included in this connectedCallback for a smaller file
    difference(date, start = new Date(), future = new Date(date),
        // local variables, declared here to prevent let
        since = future < start && ([start, future] = [future, start]),
        diff = future - start,
        day = 1e3 * 60 * 60 * 24,
        timediff = { years: ~~(diff / (day * 365)) },
        leapYears = 0,
        i // for loop variable, saves using let
    ) {
        for (i = start.getFullYear(); i < future.getFullYear(); i++)
            ((i % 4 == 0 && i % 100 != 0) || i % 400 == 0) && (since ? leapYears-- : leapYears++);
        //timediff.weeks = ~~((diff -= timediff.years * day * 7)/day);
        timediff.days = ~~((diff -= timediff.years * day * 365) / day) + leapYears;
        timediff.hours = ~~((diff -= (timediff.days - leapYears) * day) / (1e3 * 60 * 60));
        timediff.minutes = ~~((diff -= timediff.hours * 1e3 * 60 * 60) / (1e3 * 60));
        timediff.seconds = ~~((diff -= timediff.minutes * 1e3 * 60) / 1e3);
        return timediff;
    }
})