
import chalk from "chalk";



const log = console.log;

/**
 * transform: add color to text, will break box if string size is changed.
 * @param args 
 */
 export function printInBox(...args:{text:string, pos?:"center", transform?:(s:string) => string}[] ) {

	const largestTextSize = args.reduce((x, s) => x > s.text.length ? x : s.text.length , 0)
	const padding = 4 *2;
	const paddingString = " ".repeat(padding / 2);


	log(chalk.green( "╭" + "-".repeat(largestTextSize + padding) + "╮" ))
	log(chalk.green( "|" + " ".repeat(largestTextSize + padding) + "|"))

	args.forEach(string => {
		let printText:string;
		if(string.pos == 'center') {
			const l = (largestTextSize - string.text.length) / 2;
			printText = " ".repeat(Math.floor(l)) + string.text + " ".repeat(Math.ceil(l));
		} else {
			printText = string.text.padStart(largestTextSize, " ")
		}
		log(
			chalk.green("|"+paddingString) 
			+ (string.transform ? string.transform(printText) : printText)
			+ chalk.green(paddingString+"|")
		)
	})

	log(chalk.green( "|" + " ".repeat(largestTextSize + padding) + "|"))
	log(chalk.green( "╰" + "-".repeat(largestTextSize + padding) + "╯" ))


}