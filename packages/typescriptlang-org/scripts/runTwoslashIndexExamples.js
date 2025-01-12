// @ts-check

/** 
 * Converts twoslash code samples for the front page into react components, Run with:
     yarn workspace typescriptlang-org compile-index-examples
 */
const remark = require("remark")
const toHAST = require(`mdast-util-to-hast`)
const hastToHTML = require(`hast-util-to-html`)
const { join } = require(`path`)
const { readdirSync, readFileSync, lstatSync, writeFileSync } = require("fs")

const remarkTwoSlash = require("remark-shiki-twoslash")

// prettier-ignore
const examplesPath = join(__dirname,"..", "src", "components", "index", "twoslash")

// Loop through all code sames in src/components/index/twoslash and generate HTML
const go = async () => {
  console.log("Parsing index examples ->")
  for (const path of readdirSync(examplesPath, "utf-8")) {
    const name = path.split(".")[0]
    const filePath = join(examplesPath, path)
    if (lstatSync(filePath).isDirectory() || !filePath.endsWith("-sample")) {
      continue
    }

    const lightThemePrefix = ["JS", "TS"]
    const useLightTheme = lightThemePrefix.find(p => name.startsWith(p))
    const printLight = process.argv[2] === "dark"

    if (!!useLightTheme !== printLight) continue

    console.log(`Converting ${filePath}...`)
    const codeSample = name.startsWith("JS") ? "js" : "tsx"

    const code = readFileSync(filePath, "utf8")
    const markdownAST = remark().parse(
      "```" + codeSample + " twoslash\n" + code + "\n```"
    )
    const run = remarkTwoSlash.default({
      theme: useLightTheme ? "min-light" : "min-dark", // join(__dirname, "../lib/themes/typescript-beta-dark.json"),
      disableImplicitReactImport: true,
    })
    await run(markdownAST)

    const hAST = toHAST(markdownAST, { allowDangerousHtml: true })
    const html = hastToHTML(hAST, { allowDangerousHtml: true })

    console.log(html)
    const componentName = name[0].toUpperCase() + name.substring(1)
    const innerHTML = html.trim().slice(32, -6) // strips the pre
    const file = `// Auto-generated by yarn workspace typescriptlang-org compile-index-examples
import React from "react"

const innerHTML = \`${innerHTML}\`

export const ${componentName}Example = () => <pre className='shiki twoslash lsp' dangerouslySetInnerHTML={{ __html: innerHTML }} />
`
    writeFileSync(join(examplesPath, "generated", name + ".tsx"), file)
  }
}

go()
