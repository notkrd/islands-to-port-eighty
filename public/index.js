console.log('Whispers.')
const super_secret = String(Math.random()).substring(2)
const isle_id = `island${super_secret}`
console.log(`I am ${isle_id}`)
const navigator_port = 3000
let islands_known = new Set()

const navigator = new Peer(isle_id, {
    host: 'localhost',
    port: navigator_port,
    path: '/navigator'
})

const socket = io()

socket.on('islands', function(isls) {
    console.log(isls)
    islands_known = new Set(isls)
    console.log(islands_known)
})

let my_globe = {}
const union = (a, b) => [...b].reduce((u, elem) => u.add(elem), new Set([...a]))
const intersection = (a, b) => [...a].reduce(
    (i, elem) => b.has(elem) ? i.add(elem) : i, 
    new Set())
const set_diff  = (a, b) => [...a].reduce(
    (i, elem) => !b.has(elem) ? i.add(elem) : i, 
    new Set())    
const rand_element = (word_set) => [...word_set][Math.floor(Math.random()*word_set.size)]// random element from a non-empty set
const PLACEHOLDER = "[...]"
class Island {
    name;
    grammar = new Set();
    ontology = new Map();
    lexicon = new Map(); // Map from tags to words belonging to them
    
    static init_ontology = new Map([
        ["object", new Set()],
        ["relation", new Set()],
        ["place", new Set(["object"])],
        ["organization", new Set(["object"])]
    ]); // The ontology is a genealogical map from categories to the other categories they they instance. Beware circularity?
    
    static propogate_ontology(ont) {
        function all_ancestors(cat, known_ancestors) {
            if (ont.has(cat)) {
                const new_ancestors = set_diff(ont.get(cat), known_ancestors)
                // console.log(cat, known_ancestors, ont.get(cat), new_ancestors)
                return new_ancestors.size > 0 ? [...new_ancestors].reduce(
                    (ancs, new_cat) => union(ancs, all_ancestors(new_cat, ancs.add(cat))), 
                    known_ancestors)
                : known_ancestors.add(cat)
            } 
        }
        
        ont.forEach((_supers, cat) => ont.set(cat, all_ancestors(cat, new Set())))
    }
    
    static elaborate(ont, lex) {
        ont.forEach((supers, cat) => {
            supers.forEach((new_cat) => {
                lex.set(new_cat, 
                    (lex.has(new_cat) && lex.has(cat)) ? union(lex.get(new_cat), lex.get(cat)) 
                    : lex.has(new_cat) ? lex.get(new_cat) 
                    : lex.has(cat) ? lex.get(cat) 
                    : new Set()
                    );
            });
        });
    }

    static some_thing(isle, of_cat) {
        if (isle.lexicon.has(of_cat)) {
                const words = isle.lexicon.get(of_cat)
                return words.size > 0 ? rand_element(words) : PLACEHOLDER
            }
        else {
            return PLACEHOLDER
        }
    }

    static say_something(isle) {
        const s = isle.grammar.size > 0 ? rand_element(isle.grammar).map(
            (c) => this.some_thing(isle, c))
            : PLACEHOLDER
        return s.join(' ')
    }
        
    constructor(name, grammar, ontology, lexicon) {
        this.name = name;
        this.grammar = grammar;
        this.ontology = new Map([...Island.init_ontology, ...ontology]);
        this.lexicon = lexicon;
        
        this.ontology.set("object", new Set());
        this.ontology.set("relation", new Set());
        this.ontology.set("place", new Set(["object"]));
        this.ontology.set("organization", new Set(["object"]));
        
        Island.propogate_ontology(this.ontology);
        Island.elaborate(this.ontology, this.lexicon);
    }
}

function add_utterance(tablet, glyph) {
    const cell = document.createElement("div")
    cell.setAttribute("class", "cell")
    const inscrit = document.createElement("p")
    inscrit.setAttribute("class", "glyph")
    inscrit.innerText = glyph
    cell.appendChild(inscrit)
    tablet.appendChild(cell)
}

const new_paxos = new Island("New Paxos (Ionia)",
    new Set([
        ["institution", "ruling"],
        ["act", "thing", "ruling"],
        ["institution", "usage", "thing"]
    ]),
    new Map([
        ["institution", new Set(["organization"])],
        ["ruling", new Set(["relation"])],
        ["act", new Set(["relation"])],
        ["thing", new Set(["object"])],
        ["usage", new Set(["relation"])]
    ]),
    new Map([
        ["thing", new Set(["olive oil", "lamp(s)", "temple walls", "the chamber"])],
        ["institution", new Set(["the synod", "freedom of artistic expression", "the parliament", "the priesthood"])],
        ["act", new Set(["painting"])],
        ["usage", new Set(["must use only", "may not use"])],
        ["ruling", new Set(["is forbidden / outlawed", "is guaranteed / protected"])],
    ]),
    );

const pyrgi = new Island("Pyrgi (Latium)",
    new Set ([
        ["title", "name", "act", "building", "relation", "period", "event"],
        ["connective", "place", "connective", "period", "connective", "cosmic_entity"]
    ]),
    new Map([
        ["role", new Set(["relation"])],
        ["title", new Set(["role"])],
        ["name", new Set(["object"])],
        ["act", new Set(["relation"])],
        ["building", new Set(["place"])],
        ["period", new Set(["object"])],
        ["event", new Set(["object"])],
        ["site", new Set(["place"])],
        ["cosmic_entity", new Set(["object"])],
        ["connective", new Set(["relation"])],
        ["place", new Set([])],
        ["institution", new Set([])],
        ["relation", new Set([])],
        ["object", new Set([])]
    ]),
    new Map([
        ["title", new Set(["King", "Lady", "Monarch"])],
        ["name", new Set(["Astarte", "Velianas"])],
        ["act", new Set(["built", "made", "offered", "requested"])],
        ["building", new Set(["the temple", "the aedicule", "the statue"])],
        ["connective", new Set(["is", "in", "as", "for", "(may be)"])],
        ["period", new Set(["the month", "the day", "the year"])],
        ["event", new Set(["of Kiriari", "three of their reign", "of the diety's burial"])],
        ["site", new Set(["Caere", "Astarte's temples", "the holy place"])],
        ["cosmic_entity", new Set(["the stars"])]
    ]),
)

const uruk = new Island("Uruk (Sumer)",
    new Set([
        ["command", "direction", "building", "command", "direction", "determiner", "solid", "architecture"],
        ["pronoun", "social_action", "being"]
    ]),
    new Map([
        ["building", new Set(["architecture"])],
        ["architecture", new Set(["place"])],
        ["distance", new Set(["relation"])],
        ["liquid", new Set(["substance"])],
        ["place", new Set(["object"])],
        ["simile", new Set(["relation"])],
        ["solid", new Set(["substance"])],
        ["substance", new Set(["object"])],
        ["direction", new Set(["relation"])],
        ["number", new Set(["object"])],
        ["command", new Set(["relation"])],
        ["attribute", new Set(["object"])],
        ["being", new Set(["object"])],
        ["animal", new Set(["being"])],
        ["person", new Set(["being"])],
        ["determiner", new Set(["relation"])],
        ["pronoun", new Set(["object"])],
        ["possessive", new Set(["relation"])],
        ["social_action", new Set(["relation"])],
        ["relation", new Set([])],
        ["object", new Set([])]
    ]),
    new Map([
        ["role", new Set(["king", "sage", "wife", "guard"])],
        ["liquid", new Set(["beer", "oil", "water"])],
        ["solid", new Set(["stone", "clay", "brick", "copper", "bronze"])],
        ["simile", new Set(["like", "as", ])],
        ["direction", new Set(["up on", "close to", "up to", "around"])],
        ["distance", new Set(["league(s)"])],
        ["number", new Set(["one", "three", "seven"])],
        ["command", new Set(["go", "look", "take hold", "inspect"])],
        ["attribute", new Set(["silence", "strength", "thirst"])],
        ["animal", new Set(["gazelles", "animals"])],
        ["person", new Set(["wom(a/e)n", "herder(s)"])],
        ["architecture", new Set(["inner wall", "threshold stone", "foundation", "structure"])],
        ["social_action", new Set(["ate with", "drank with", "knew", "jostled with"])],
        ["building", new Set(["(the) wall", "(the) temple"])],
        ["determiner", new Set(["the", "its"])],
        ["pronoun", new Set(["you", "he(/him)", "she(/her)"])],
        ["possessive", new Set(["your(s)", "his", "hers"])]
    ])
)


my_globe = {
    "new_paxos": new_paxos,
    "pyrgi": pyrgi,
    "uruk": uruk
}
    
const speak_btn = document.getElementById("speakbtn")
const port_select = document.getElementById("portselect")

Object.entries(my_globe).forEach(([isle_key, isle_val]) =>
{
    const isle_option = document.createElement("option")
    isle_option.setAttribute("value", isle_key)
    const isle_text = document.createTextNode(isle_val.name)
    isle_option.appendChild(isle_text)
    port_select.appendChild(isle_option)
})

this_isle = new_paxos
port_select.addEventListener("change", function(){ this_isle=my_globe[port_select.value] })
const the_tablet = document.getElementById("thetablet")


speak_btn.onclick = function () { add_utterance(the_tablet, Island.say_something(this_isle)) }