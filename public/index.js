let my_globe = {}
const union = (a, b) => [...b].reduce((u, elem) => u.add(elem), new Set([...a]))
const intersection = (a, b) => [...a].reduce(
    (i, elem) => b.has(elem) ? i.add(elem) : i, 
    new Set())
const set_diff  = (a, b) => [...a].reduce(
    (i, elem) => !b.has(elem) ? i.add(elem) : i, 
    new Set())    
const rand_element = (word_set) => [...word_set][Math.floor(Math.random()*[...word_set].length)] // random element from a non-empty set
const PLACEHOLDER = "[...]"
let last_identifier = 0
let prop_identifier = 0
let prop_value = 0
let proposals_rejected = new Set()
let promises_received = new Set()
let accepts_received = new Map()
curr_proclamation={}
curr_proposal={}
let proposals_accepted = new Set()

const the_tablet = document.getElementById("thetablet")
const the_incoming = document.getElementById("incoming")
const acknowledge_btn = document.getElementById("acknowledgebtn")
const reject_btn = document.getElementById("rejectbtn")
const msg_status = document.getElementById("msgstatus")
const proc_status = document.getElementById("procstatus")
const cons_status = document.getElementById("consensusstatus")
const the_private = document.getElementById("private")
const islands_list = document.getElementById("islandslist")
const dictionary = document.getElementById("dictionary")
class Island {
    name;
    utterances = new Set();
    ontology = new Map();
    lexicon = new Map(); // Map from phrases to categories they belong to
    grammar = [];
    
    static init_ontology = new Map([
        ["entity", new Set()],
        ["relation", new Set()],
        ["attribute", new Set()],
        ["action", new Set()],
        ["time", new Set()],
        ["agent", new Set(["entity"])],
        ["patient", new Set(["entity"])],
        ["event", new Set(["time"])],
        ["place", new Set(["entity"])],
        ["animal", new Set(["agent"])],
        ["plant", new Set(["entity"])],
        ["person", new Set(["agent"])],
        ["food", new Set(["entity"])],
        ["structure", new Set(["entity"])],
        ["gift", new Set(["relation"])],
        ["attack", new Set(["action"])],
        ["travel", new Set(["action"])],
        ["quantity", new Set(["attribute"])],
        ["organization", new Set(["agent"])]
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

    static learn_sentence(sent, the_lexicon, the_grammar) {
        let annotated = []
        let remaining = sent
        while(remaining.length>0){
            let match_found = false
            for (const a_phrase of the_lexicon.keys()) {
                if(JSON.stringify(remaining.slice(0,a_phrase.length)) == JSON.stringify(a_phrase)) {
                    annotated.push({'kind': "VARIABLE", 'categories': [...the_lexicon.get(a_phrase)]})
                    remaining = remaining.slice(a_phrase.length)
                    match_found = true
                    break
                }
            }
            if(!match_found){
                annotated.push({'kind': "WORD", 'value': remaining[0]})
                remaining = remaining.slice(1)
            }
        }
        the_grammar.push(annotated)
    }

    static make_sentence(isle, the_syntax) {
        let new_phrases = []
        const the_sentence = the_syntax.reduce((s, x) => {
            if (x['kind'] == 'WORD') {
                return s.concat([x['value']]);
            }
            else if (x['kind'] == 'VARIABLE') {
                let possible_phrases = [...isle.lexicon.keys()].filter((a_phrase) => (new Set(x['categories'])).isSubsetOf(isle.lexicon.get(a_phrase)))
                if(possible_phrases) {
                    let new_phrase = rand_element(possible_phrases);
                    new_phrases.push([new_phrase, [...isle.lexicon.get(new_phrase)]]);
                    return s.concat(new_phrase);
                }
                else {
                    return s.concat([rand_element(x['categories'])]);
                }

            }
        }, new Array())
        return {'utterance': the_sentence.join(" "), 'phrases': new_phrases, 'pattern': the_syntax}
    }

    static learn_grammar(isle) {
        isle.utterances.forEach((u) => this.learn_sentence(u, isle.lexicon, isle.grammar))
    }

    static say_something(isle) {
        return Island.make_sentence(isle, rand_element(isle.grammar))
    }

    static learn_proclamation(isle, proc) {
        proc['phrases'].forEach((phr) => {if (!isle.lexicon.has(phr[0])) {isle.lexicon.set(phr[0], new Set(phr[1]))}})
        if (!isle.grammar.includes(proc['pattern'])){
            isle.grammar.push(proc['pattern'])
        }
    }
        
    constructor(name, utterances, ontology, lexicon, grammar) {
        this.name = name;
        this.utterances = utterances;
        this.ontology = new Map([...Island.init_ontology, ...ontology]);
        this.lexicon = lexicon;        
        this.grammar = grammar;
        Island.propogate_ontology(this.ontology);
        Island.elaborate(this.ontology, this.lexicon);
        console.log(this.lexicon)
        Island.learn_grammar(this)
    }
}

const new_paxos = new Island(
    "Paxos (Unreal Ionia)",
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
        ["valuation", new Set (["attribute"])],
        ["obligation", new Set (["relation"])],
        ["valuation", new Set (["attribute"])],
        ["number", new Set (["attribute"])],
        ["color", new Set (["attribute"])],
        ["description", new Set (["attribute"])],
        ["right", new Set (["relation"])],
        ["plant", new Set (["entity"])],
        ["currency", new Set (["entity"])]
    ]),
    new Map([
        [["olive"], new Set(["plant"])],
        [["drachmas"], new Set(["currency"])],
        [["forbidden"], new Set (["valuation"])],
        [["guaranteed"], new Set (["valuation"])],
        [["painting"], new Set (["action"])],
        [["temple","walls"], new Set (["building"])],
        [["freedom","of", "artistic", "expression"], new Set (["right"])],
        [["tax"], new Set (["obligation"])],
        [["9"], new Set (["number"])],
        [["3"], new Set (["number"])],
        [["goats"], new Set (["animal"])],
        [["black"], new Set (["description"])],
        [["brown"], new Set (["description"])],
        [["sale"], new Set (["gift"])],
    ]),
    []
)

const pyrgi = new Island(
    "Pyrgi (Latium)",
    new Set([
        ["for", "the", "lady", "astarte", "this", "is", "the", "holy", "place"],
        ["which", "made", "and", "which", "offered", "thefarie", "velianas", "king", "over", "Caere", "the", "month", "of", "solar", "sacrifice", "as", "gift", "in", "the", "temple"],
        ["and", "he", "built", "an", "aedicule", "because", "astarte", "requested", "it", "from", "him"],
        ["year", "3", "of", "his", "reign", "in", "the", "month", "of", "kirani", "on", "the", "day", "of", "the", "deity's", "burial"],
        ["and", "as", "for", "the", "years", "of", "the", "deity's", "statue", "in", "her", "temple", "these", "may", "be", "so", "many", "years", "as", "the", "stars"]
    ]),
    new Map([
        ["title", new Set(["attribute"])],
        ["name", new Set(["attribute"])],
        ["monument", new Set(["structure", "place"])],
        ["city", new Set(["place"])],
        ["number", new Set (["attribute"])],
        ["description", new Set (["attribute"])],
        ["occasion", new Set (["time", "event"])],
        ["deity", new Set (["agent"])],
        ["period", new Set (["time", "duration"])],
        ["cosmology", new Set (["entity"])]
    ]),
    new Map([
        [["lady"], new Set(["title"])],
        [["monarch"], new Set(["title"])],
        [["year"], new Set(["period"])],
        [["month"], new Set(["period"])],
        [["day"], new Set(["period"])],
        [["three"], new Set (["number"])],
        [["astarte"], new Set(["deity"])],
        [["made"], new Set(["action"])],
        [["offered"], new Set(["action"])],
        [["Thefarie", "Velianas"], new Set(["person"])],
        [["caere"], new Set(["city"])],
        [["of", "solar", "sacrifice"], new Set(["occasion"])],
        [["kirani"], new Set(["occasion"])],
        [["his", "reign"], new Set(["occasion"])],
        [["the", "deity's", "burial"], new Set(["occasion"])],
        [["temple"], new Set(["monument"])],
        [["statue"], new Set(["monument"])],
        [["aedicule"], new Set(["monument"])],
        [["stars"], new Set(["cosmological"])],
        [["holy"], new Set(["description"])],
        [["place"], new Set(["kind"])]
    ]),
    []
    // new Set([
    //         ["for", "the", "$title", "$deity", "this", "is", "the", "$holy", "$kind"],
    //         ["which", "$action", "and", "which", "$action", "$person", "$title", "over", "$city", "the", "$period", "$occasion", "as", "gift", "in", "the", "$monument"]
    //     ])
)

const naqsh_e_rostam = new Island(
    "Darius Naqsh-e Rostam (Achaemenid)",
    new Set([
        "A great god is Ahuramazda, who created this excellent work which is seen, who created happiness for man, who bestowed wisdom and activity upon Darius the King.".toLowerCase().split(" "),
        "Darius the King says: By the favor of Ahuramazda I am of such a sort that I am a friend to right, I am not a friend to wrong.".toLowerCase().split(" "), 
        "It is not my desire that the weak man should have wrong done to him by the mighty; nor is that my desire, that the mighty man should have wrong done to him by the weak.".toLowerCase().split(" "),
        "I am not a friend to the man who is a Lie-follower. I am not hot-tempered.".toLowerCase().split(" "),
        "What things develop in my anger, I hold firmly under control by my thinking power.".toLowerCase().split(" "),
        "The man who cooperates, him according to his cooperative action, him thus do I reward.".toLowerCase().split(" "),
        "What a man says against a man, that does not convince me, until he satisfies the Ordinance of Good Regulations.".toLowerCase().split(" ")
    ]),
    new Map([
        ["title", new Set(["attribute"])],
        ["name", new Set(["attribute"])],
        ["number", new Set (["attribute"])],
        ["character", new Set (["attribute"])],
        ["disposition", new Set (["attribute"])],
        ["description", new Set (["attribute"])],
        ["occasion", new Set (["time", "event"])],
        ["law", new Set (["entity"])],
        ["valuation", new Set (["entity"])],
        ["capacity", new Set (["entity"])],
        ["deity", new Set (["agent"])],
    ]),
    new Map([
        [["king"], new Set(["title"])],
        [["god"], new Set(["title"])],
        [["ahuramazda"], new Set(["deity"])],
        [["darius"], new Set(["name"])],
        [["right"], new Set(["description"])],
        [["wrong"], new Set(["description"])],
        [["weak"], new Set(["character"])],
        [["mighty"], new Set(["character"])],
        [["hot-tempered"], new Set(["character"])],
        [["cooperative", "action"], new Set(["action"])],
        [["convince"], new Set(["action"])],
        [["develop"], new Set(["action"])],
        [["thinking", "power"], new Set(["capacity"])],
        [["anger"], new Set(["capacity"])],
        [["wisdom"], new Set(["capacity"])],
        [["happiness"], new Set(["capacity"])],
        [["activity"], new Set(["capacity"])],
        [["lie-Follower"], new Set(["disposition"])],
        [["friend", "to", "right"], new Set(["disposition"])],
        [["friend", "to", "wrong"], new Set(["disposition"])],
        [["man", "who", "cooperates"], new Set(["disposition"])]
    ]),
    []
)

const ea_nasir = new Island(
    "Ea Nasir (Ur)",
    new Set([
        "When you came, you said to me as follows: ‘I will give Gimil-Sin (when he comes) fine quality copper ingots.’".toLowerCase().split(" "),
        "You put ingots which were not good before my messenger Sit-Sin".toLowerCase().split(" "), 
        "If you want to take them, take them; if you do not want to take them, go away’".toLowerCase().split(" "),
        "What do you take me for, that you treat somebody like me with such contempt?".toLowerCase().split(" "),
        "On account of that one mina of silver which I owe you, you feel free to speak in such a way, while I have given to the palace on your behalf 1,080 pounds of copper".toLowerCase().split(" ")
    ]),
    new Map([
        ["currency", new Set (["entity"])],
        ["metal", new Set (["entity"])],
        ["name", new Set (["attribute"])],
        ["description", new Set (["attribute"])],
        ["profession", new Set (["attribute"])]
]),
    new Map([
        [["ingots"], new Set(["currency"])],
        [["mina"], new Set(["currency"])],
        [["copper"], new Set(["metal"])],
        [["silver"], new Set(["metal"])],
        [["gimil-sin"], new Set(["name"])],
        [["sit-sin"], new Set(["name"])],
        [["take", "them"], new Set(["action"])],
        [["go", "away"], new Set(["action"])],
        [["fine", "quality"], new Set(["description"])],
        [["not", "good"], new Set(["description"])],
        [["messenger"], new Set(["profession"])]
    ]),
    []
)

const chamalieres = new Island(
    "Chamalières (Gaul)",
    new Set([
        "In the name of the good strength of the underworld gods, I invoke Maponos of Arverion".toLowerCase().split(" "),
        "Pursue… those with the magic of the infernals".toLowerCase().split(" "),
        "If it is reduced it is full - I straighten what is crooked".toLowerCase().split(" "),
        "I see blind … place to my right place to my right place to my right".toLowerCase().split(" ")
    ]),
    new Map([
        ["title", new Set(["attribute"])],
        ["place", new Set(["entity"])],
        ["number", new Set (["attribute"])],
        ["character", new Set (["attribute"])],
        ["disposition", new Set (["attribute"])],
        ["description", new Set (["attribute"])],
        ["occasion", new Set (["time", "event"])],
        ["law", new Set (["entity"])],
        ["valuation", new Set (["entity"])],
        ["capacity", new Set (["entity"])],
        ["deity", new Set (["agent"])],
    ]),
    new Map([

    ]),
    []
)

my_globe = {
    "pyrgi": pyrgi,
    "new_paxos": new_paxos,
    "naqsh_e_rostam": naqsh_e_rostam,
    "ea_nasir": ea_nasir
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
    
function set_utterance(tablet, glyphs) {
    erase(tablet)
    add_utterance(tablet, glyphs)
}

const speak_btn = document.getElementById("speakbtn")
const refresh_btn = document.getElementById("refreshbtn")
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

function update_island() {
    this_isle=my_globe[port_select.value]
    list_words(this_isle)
    set_utterance(the_tablet, "")
    refresh_statement()
}

port_select.addEventListener("change", update_island)
let rand_isle_name = rand_element(Object.keys(my_globe))
port_select.value = rand_isle_name
this_isle = my_globe[rand_isle_name]

list_words(this_isle)
speak_btn.onclick = proclame
refresh_btn.onclick = refresh_statement
acknowledge_btn.onclick = acknowledge_proposal
reject_btn.onclick = reject_proposal
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

function receive_proposal(a_prop) {
    curr_proposal = a_prop
    set_utterance(the_incoming, curr_proposal['proclamation']['utterance'])
    acknowledge_btn.style.display = "inline"
    reject_btn.style.display = "inline"
    msg_status.style.display= "none"
}

function confirm_proclamation(data) {
    console.log(`Your proclamation "${data['proclamation']['utterance']}" has been acknowledged and will now be proposed`)
    routes_known.forEach((route, _isl) => {
        // console.log(route, isl)
        route.send({"kind": "ACCEPT?", "identifier": data['identifier'], "proclamation": data['proclamation'], "source": my_isle_id})
        start_round()
    })
}

function do_we_accept_proclamation(data){
    if(data['identifier'] >= last_identifier) {
        add_to_accepted(data['identifier'], my_isle_id)
        routes_known.forEach((route, _isl) => {
            // console.log(route, isl)
            route.send({"kind": "ACCEPTED", "identifier": data['identifier'], "value": data['value'], "proclamation": data["proclamation"], "source": my_isle_id})
        })
    }
}

function add_to_accepted(the_identifier, the_id){
    if(accepts_received.has(the_identifier)){
        accepts_received.get(the_identifier).add(the_id)
    }
    else {
        accepts_received.set(the_identifier, new Set([the_id]))
    }
}

function accepted_proclamation(data) {
    add_to_accepted(data['identifier'], data['source'])
    if(accepts_received.get(data['identifier']).size > (islands_known.size / 2)) {
        implement_proclamation(data)
    }
}

function implement_proclamation(data) {
    if(!proposals_accepted.has(data['identifier'])){
        proposals_accepted.add(data['identifier'])
        add_utterance(the_tablet, Island.say_something(this_isle)['utterance'])
        last_identifier = data['identifier']
        Island.learn_proclamation(this_isle, data['proclamation'])
        list_words(this_isle)
        cons_status.innerText = `Proclamation "${data['proclamation']['utterance']}" has been elevated to consensus`
        start_round()
    }
}

function receive_promise(data) {
    promises_received.add(data['source'])
    proc_status.innerText= `Proclamation proclamed. Acknowledgements received: ${promises_received.size}`
    if(promises_received.size > islands_known.size/2) {
        confirm_proclamation(data)
    }
    prop_value = Math.max(prop_value, data['last_value'])
}

function connection_logic(conn) {
    conn.on('open', function() {
        islands_known.add(conn.peer)
        routes_known.set(conn.peer, conn)
        // console.log(routes_known)
        console.log("Route found to", conn.peer)

        conn.on('data', function(data) {
            console.log("Received", data)
            if(data['kind']=="PREPARE") {
                if(data['identifier'] > last_identifier) {
                    receive_proposal(data)
                }
            }
            if(data['kind']=="PROMISE") {
                receive_promise(data)
            }
            if(data['kind']=="ACCEPT?") {
                do_we_accept_proclamation(data)
            }
            if(data['kind']=="ACCEPTED") {
                accepted_proclamation(data)
            }
            if(data['kind']=="RESET") {
                start_round()
            }
        })
    })
}

function acknowledge_proposal() {
    [acknowledge_btn, reject_btn].forEach((btn) => btn.style.display = "none")
    msg_status.innerText= `Proclamation acknowledged. Awaiting majority or more compelling message.`
    routes_known.get(curr_proposal['source']).send({'kind': "PROMISE", 'identifier': curr_proposal['identifier'], 'proclamation': curr_proposal['proclamation'], 'last_value': prop_value, "source": my_isle_id})
    msg_status.style.display= "block"
    last_identifier = curr_proposal['identifier']
    console.log("New Proposal Identifier: ", last_identifier)
}
function reject_proposal() {
    proposals_rejected.add(curr_proposal['identifier']);
    [acknowledge_btn, reject_btn].forEach((btn) => btn.style.display = "none")
    msg_status.innerText= `Proclamation ignored. Awaiting more compelling message.`
    msg_status.style.display= "block"
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
    speak_btn.style.display= "none"
    refresh_btn.style.display= "none"
    proc_status.style.display= "block"
    promises_received.add(my_isle_id)
    proc_status.innerText= `Proclamation proclamed. Acceptances received: only your own`
    routes_known.forEach((route, _isl) => {
        // console.log(route, isl)
        route.send({"kind": "PREPARE", "identifier": prop_identifier, "proclamation": curr_proclamation, "source": my_isle_id})
    })
}

function refresh_statement() {
    curr_proclamation = Island.say_something(this_isle)
    set_utterance(the_private, curr_proclamation['utterance'])
}

function reset_round() {
    routes_known.forEach((route, _isl) => {
    // console.log(route, isl)
        route.send({"kind": "RESET"})
}) 
}

function start_round() {
    proposals_rejected = new Set()
    prop_identifier = last_identifier + Math.ceil(Math.random()*1000)
    console.log("VAL: ", prop_identifier)
    curr_proclamation = Island.say_something(this_isle)
    set_utterance(the_private, curr_proclamation['utterance'])
    set_utterance(the_incoming, "")
    promises_received = new Set();
    [acknowledge_btn, reject_btn].forEach((btn) => btn.style.display = "none")
    speak_btn.style.display= "inline"
    refresh_btn.style.display= "inline"
    msg_status.style.display= "block"
    msg_status.innerText= "Awaiting message"
    proc_status.style.display= "none"
}

update_island()
start_round()