import { Plugin } from "../plugin";
import chalk from 'chalk';
import { IrcMap, PRIVMSG } from "../types";
import { DataStorage } from "../../../data/datastorage.js";


class VoteMachine {
    private votes: Record<string, string[]> = {}
    private hasVotedRegister = new Set<string>();
    private startedBy:string = "__unknown__"
    private pollName:string = "__unknown__"
    private endedBy:string = "__unknown__"
    
    private _isPolling:boolean = false;
    private pollStartedAt:number;
    private pollEndedAt:number;

    get isPolling() {
        return this._isPolling;
    }

    startPoll(startedBy:string, name?:string) {
        if(name) this.pollName = name;
        this.startedBy = startedBy;
        this._isPolling = true;
        this.pollStartedAt = Date.now();
    }

    endPoll(endedBy:string) {
        this.endedBy = endedBy;
        this._isPolling = false;
        this.pollEndedAt = Date.now();
    }

    addVote(username:string, vote:string): boolean {
        if(!this._isPolling || this.hasVotedRegister.has(username)) return false;
        if(!this.votes[vote]) this.votes[vote] = [];
        this.votes[vote].push(username);
        this.hasVotedRegister.add(username);
        return true
    }

    toJson() {
        return JSON.stringify({
            name: this.pollName,
            startedBy: this.startedBy,
            pollStartedAt: this.pollStartedAt,
            endedBy: this.endedBy,
            pollEndedAt: this.pollEndedAt,
            markdown: this.getMarkdownTable(),
            votes: this.votes,
            hasVotedRegister: [...this.hasVotedRegister],
        }, null, 4)
    }

    /**
     * Returns a markdown like table. 
     * Each item in the array represents a single row.
     * Rows are -> Header, Seperator, DataRows*X, Totals
     */
    getMarkdownTable() {
        // Calculate col width based on largest username
        const colSize = Math.max([...this.hasVotedRegister].reduce((n,curr) => curr.length+2 > n ? curr.length+2 : n, 0), 10)
        const voteOptions = Object.keys(this.votes).map( s => s.toString()).sort();
        const rows = voteOptions.reduce((max, key) => Math.max(max, this.votes[key].length),0)
        const table: string[] = []; // Markdown Table
        
        // |     key1 |     key2 |     key3 | # Header of column names
        table.push(
            voteOptions.reduce((string, key) => string + key.padStart(colSize, " ") + " | ", "| ").trim()
        )
        // |----------|----------|----------| # Seperator
        table.push(
            voteOptions.reduce((string, _) => string + "".padStart(colSize+1, " ") + "| ", "| ").trim().replaceAll(" ", "-")
        )

        // |    user1 |          |    user2 | # DataRows
        // |    user3 |          |          | 
        for (let i = 0; i < rows; i++) {
            table.push(
                voteOptions.reduce((string, key) => {
                    const voter = this.votes[key][i] ?? "";
                    return string + voter.padStart(colSize, " ") + " | "
                }, "| ")
            )
        }

        // | total: 2 | total: 0 | total: 1 | # Totals
        table.push(
            voteOptions.reduce((string, key) => {
                const votes = "total: " + (this.votes[key].length.toString() ?? "?");
                return string + votes.padStart(colSize, " ") + " | "
            }, "| ").trim()
        )
        
        return table;
    }

}

let poll = new VoteMachine();

function canStartPoll(map:PRIVMSG) {
    return map.mod == "1" || map.badges.indexOf("broadcaster/1") > -1
}
function isCommand(message:string) {
    return message[0] === "!";
}

export const PollChatPlugin:Plugin = {
    name:"PollChatPlugin",

    order:4,

    onPrivmsg: (map, data) => {

        if(isCommand(map.PRIVMSG) && canStartPoll(map)) {
            const command = map.PRIVMSG.toLowerCase();
            if (command.startsWith("!pollstart")) 
            {
                data.breakSequence = true
                console.log(map["display-name"], "command !pollstart")
                poll.startPoll(map["display-name"], map.PRIVMSG);
            } 
            else if (command.startsWith("!pollend")) 
            { 
                data.breakSequence = true
                console.log(map["display-name"], "command !pollend")

                poll.endPoll(map["display-name"]);
  
                // Store poll in json
                const [day, time] = new Date().toLocaleString().split(",")
                var folder = day.replace(/\//g, "-").padStart(10, "0");
                var filename = time.replace(/:/g, "-").trim().split(" ")[0].padStart(8, "0")
            
                DataStorage.store(`poll/${folder}/${filename}`, poll, true)

                poll = new VoteMachine()

            }
        }

        if(poll.isPolling && (map.PRIVMSG[0] == "1" || map.PRIVMSG[0] == "2")) {
            data.breakSequence = true
            if(poll.addVote(map["display-name"]+ ": " + map.PRIVMSG, map.PRIVMSG[0])) {
                console.log(chalk.hex(map.color)(map["display-name"] + ": Voted " + map.PRIVMSG));
            }
        }

    }
}
