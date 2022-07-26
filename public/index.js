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
        ["object", new Set()],
        ["relation", new Set()],
        ["attribute", new Set()],
        ["action", new Set()],
        ["place", new Set(["object"])],
        ["animal", new Set(["object"])],
        ["plant", new Set(["object"])],
        ["person", new Set(["object"])],
        ["food", new Set(["object"])],
        ["structure", new Set(["object"])],
        ["gift", new Set(["action"])],
        ["attack", new Set(["action"])],
        ["travel", new Set(["action"])],
        ["quantity", new Set(["attribute"])],
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
            else {
                return new Set()
            }
        }
        
        ont.forEach((_supers, cat) => ont.set(cat, all_ancestors(cat, new Set())))
    }
    
    static elaborate(ont, lex) {
        lex.forEach((cats, word) => {
            cats.forEach((supers, cat) => {
                if (ont.has(cat)) {
                    lex.set(word, union(cats, supers))
                }
            });
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
        ["building", new Set(["structure"])],
        ["legality", new Set (["attribute"])],
        ["obligation", new Set (["relation"])],
        ["number", new Set (["attribute"])],
        ["right", new Set (["institution"])],
    ]),
    new Map([
        [["olive"], new Set(["food", "plant"])],
        [["must", "use", "only"], new Set (["obligation"])],
        [["is","forbidden"], new Set (["legality"])],
        [["is","guaranteed"], new Set (["legality"])],
        [["painting"], new Set (["action"])],
        [["temple","walls"], new Set (["building"])],
        [["freedom","of", "artistic", "expression"], new Set (["building"])],
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
new Map([]),
new Map([])
)

my_globe = {
    "new_paxos": new_paxos,
    "pyrgi": pyrgi
}

function add_utterance(tablet, glyphs) {
    const cell = document.createElement("div")
    cell.setAttribute("class", "cell")
    const inscrit = document.createElement("p")
    inscrit.setAttribute("class", "glyphs")
    inscrit.innerText = glyphs
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

this_isle = new_paxos
port_select.addEventListener("change", function(){ this_isle=my_globe[port_select.value] })
const the_tablet = document.getElementById("thetablet")
const islands_list = document.getElementById("islandslist")

last_tried = 0
prev_bal = 0
next_bal = 0
curr_status = "IDLE"
prev_votes = new Set()

speak_btn.onclick = proclame

function list_islands(isls, my_isle) {
    erase(islands_list)
    isls.forEach((isl) => {
        isl_declaration = my_isle == isl ? `I am ${my_isle}` : isl
        add_utterance(islands_list, isl_declaration)
    })
}

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
        console.log("Connected to", conn.peer)

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
        routes.delete(isl)
    });
    console.log(routes_known)
}

function proclame() {
    const proclamation = Island.say_something(this_isle)
    add_utterance(the_tablet, proclamation)
    routes_known.forEach((route, isl) => {
        // console.log(route, isl)
        route.send(proclamation)
    })
}