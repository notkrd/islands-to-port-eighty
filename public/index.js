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
    utterances = new Set();
    ontology = new Map();
    lexicon = new Map(); // Map from phrases to categories they belong to
    
    static init_ontology = new Map([
        ["entity", new Set()],
        ["relation", new Set()],
        ["attribute", new Set()],
        ["action", new Set()],
        ["time", new Set()],
        ["event", new Set(["time"])],
        ["place", new Set(["entity"])],
        ["animal", new Set(["entity"])],
        ["plant", new Set(["entity"])],
        ["person", new Set(["entity"])],
        ["food", new Set(["entity"])],
        ["structure", new Set(["entity"])],
        ["gift", new Set(["relation"])],
        ["attack", new Set(["action"])],
        ["travel", new Set(["action"])],
        ["quantity", new Set(["attribute"])],
        ["organization", new Set(["entity"])]
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
            else {
                return known_ancestors.add(cat)
            }
        }
        
        ont.forEach((_supers, cat) => ont.set(cat, all_ancestors(cat, new Set())))
    }
    
    static elaborate(ont, lex) {
        lex.forEach((cats, word) => {

            let new_cats = cats
            cats.forEach((cat) => {
                if (ont.has(cat)) {
                    new_cats = union(new_cats, ont.get(cat))
                }
            });
            lex.set(word, new_cats)
        });
    }

    static say_something(isle) {
        const s = isle.utterances.size > 0 ? rand_element(isle.utterances)
            : [PLACEHOLDER]
        return s.join(' ')
    }
        
    constructor(name, utterances, ontology, lexicon) {
        this.name = name;
        this.utterances = utterances;
        this.ontology = new Map([...Island.init_ontology, ...ontology]);
        this.lexicon = lexicon;        
        Island.propogate_ontology(this.ontology);
        Island.elaborate(this.ontology, this.lexicon);
    }
}

const new_paxos = new Island("Paxos (Unreal Ionia)",
    new Set([
        ["the", "olive", "tax", "is", "3", "drachmas", "per", "ton"],
        ["lamps", "must", "use", "only", "olive", "oil"],
        ["painting", "on", "temple", "walls", "is", "forbidden"],
        ["freedom", "of", "artistic", "expression", "is", "guaranteed"],
        ["the", "sale", "of", "brown", "goats", "is", "permitted"],
        ["the", "sale", "of", "black", "goats", "is", "permitted"],
        ["the", "olive", "tax", "is", "9", "drachmas", "per", "ton"]
    ]),
    new Map([
        ["building", new Set(["structure", "place"])],
        ["legality", new Set (["attribute"])],
        ["obligation", new Set (["relation"])],
        ["number", new Set (["attribute"])],
        ["right", new Set (["relation"])],
    ]),
    new Map([
        [["olive"], new Set(["food", "plant"])],
        [["must", "use", "only"], new Set (["obligation"])],
        [["is","forbidden"], new Set (["legality"])],
        [["is","guaranteed"], new Set (["legality"])],
        [["painting"], new Set (["action"])],
        [["temple","walls"], new Set (["building"])],
        [["freedom","of", "artistic", "expression"], new Set (["right"])],
        [["9"], new Set (["number"])],
        [["brown", "goats"], new Set (["animal"])],
        [["sale"], new Set (["gift"])],
    ])
)

const pyrgi = new Island("Pyrgi (Latium)",
new Set([
    ["for", "the", "lady", "astarte", "this", "is", "the", "holy", "place"],
    ["which", "made", "and", "which", "offered", "Thefarie", "Velianas", "king", "over", "Caere", "the", "month", "of", "solar", "sacrifice", "as", "gift", "in", "the", "temple"],
    ["and", "he", "built", "an", "aedicule", "because", "Astarte", "requested", "it", "from", "him"],
    ["year", "3", "of", "his", "reign", "in", "the", "month", "of", "Kirani", "on", "the", "day", "of", "the", "deity's", "burial"],
    ["and", "as", "for", "the", "years", "of", "the", "deity's", "statue", "in", "her", "temple", "these", "may", "be", "so", "many", "years", "as", "the", "stars"]
]),
new Map([
    ["title", new Set(["attribute"])],
    ["name", new Set(["attribute"])],
    ["monument", new Set(["structure", "place"])],
    ["number", new Set (["attribute"])],
    ["occasion", new Set (["time", "event"])],
    ["deity", new Set (["entity"])],
    ["period", new Set (["time", "duration"])],
    ["cosmology", new Set (["entity"])]
]),
new Map([
    [["lady"], new Set(["title"])],
    [["monarch"], new Set(["title"])],
    [["year"], new Set(["period"])],
    [["month"], new Set(["period"])],
    [["day"], new Set(["period"])],
    [["Astarte"], new Set(["deity"])],
    [["of", "solar", "sacrifice"], new Set(["occasion"])],
    [["Kirani"], new Set(["occasion"])],
    [["the", "deity's", "statue"], new Set(["occasion"])],
    [["his", "reign"], new Set(["occasion"])],
    [["the", "deity's", "burial"], new Set(["occasion"])],
    [["temple"], new Set(["monument"])],
    [["statue"], new Set(["monument"])],
    [["aedicule"], new Set(["monument"])],
    [["the stars"], new Set(["cosmological"])],
])
)

my_globe = {
    "pyrgi": pyrgi,
    "new_paxos": new_paxos
}

function add_utterance(tablet, glyphs) {
    const cell = document.createElement("div")
    cell.setAttribute("class", "cell")
    const inscrit = document.createElement("p")
    inscrit.setAttribute("class", "glyphs")
    inscrit.innerText = glyphs.toUpperCase()
    cell.appendChild(inscrit)
    tablet.appendChild(cell)
}
function erase(tablet) {
    tablet.innerHTML = ""
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



function list_islands(isls, my_isle) {
    erase(islands_list)
    isls.forEach((isl) => {
        isl_declaration = my_isle == isl ? `I am ${my_isle}` : isl
        add_utterance(islands_list, isl_declaration)
    })
}

function list_words(a_world) {
    erase(dictionary)
    const word_str = 
        (cats, phrase) => phrase.join(" ").toUpperCase() + ": " + Array.from(cats).join(", ")
    a_world.lexicon.forEach((cats, phrase) => {
        add_utterance(dictionary, word_str(cats, phrase))
    })
}

this_isle = pyrgi
const the_tablet = document.getElementById("thetablet")
const islands_list = document.getElementById("islandslist")
const dictionary = document.getElementById("dictionary")

function update_island() {
    this_isle=my_globe[port_select.value]
    list_words(this_isle)
}

port_select.addEventListener("change", update_island)
list_words(this_isle)
last_tried = 0
prev_bal = 0
next_bal = 0
curr_status = "IDLE"
prev_votes = new Set()

speak_btn.onclick = proclame
console.log('Whispers.')
const super_secret = String(Math.random()).substring(2)
const my_isle_id = `island${super_secret}`
console.log(`I am ${my_isle_id}`)
const navigator_port = 3000
let islands_known = new Set([my_isle_id])
let routes_known = new Map()

const socket = io()

socket.on('islands', function(isls) {
    islands_known = new Set(isls)
    list_islands(islands_known, my_isle_id)
    update_routes(islands_known, routes_known)
})

const navigator = new Peer(my_isle_id, {
    host: 'localhost',
    port: navigator_port,
    path: '/navigator'
})

function connection_logic(conn) {
    conn.on('open', function() {
        islands_known.add(conn.peer)
        routes_known.set(conn.peer, conn)
        // console.log(routes_known)
        console.log("Route found to", conn.peer)

        conn.on('data', function(data) {
            console.log("Received", data)
            add_utterance(the_tablet, data)
        })
    })
}

navigator.on('connection', function (conn) {
    connection_logic(conn)
})

function update_routes(isles, routes) {
    isles.forEach((isl) => {
        if(isl != my_isle_id && !routes.has(isl)) {
            const conn = navigator.connect(isl)
            routes.set(isl, conn); 
            connection_logic(conn);
        }
    });
    const lost_routes = set_diff(new Set([...routes.keys()]), isles)
    lost_routes.forEach((isl) => {
        routes.get(isl).close()
        console.log(`Route to ${isl} lost`)
        routes.delete(isl)
    });
    console.log(routes_known)
}

function proclame() {
    const proclamation = Island.say_something(this_isle)
    add_utterance(the_tablet, proclamation.toUpperCase())
    routes_known.forEach((route, isl) => {
        // console.log(route, isl)
        route.send(proclamation)
    })
}