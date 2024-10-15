import config from "../config/config.js";
import { getFileBySha, getFileCommitSha } from "../utils/utils.js";

export default async function pvtGetGuidanceLinks(context, req) {
  try {
    const { version } = req.params;

    if (!config.VERSIONS.includes(version)) {
      context.res = {
        status: 422,
        headers: { "Content-Type": "application/json" },
        body: {
          error: true,
          message: `Version '${version}' of the IATI Standard is not supported. Supported versions: ${config.VERSIONS.join(
            ", ",
          )}`,
        },
      };
      return;
    }

    const rulesetBranch = `version-${version}`;

    console.log({
      name: `Fetching ruleset for version: ${version}, repo: IATI-Rulesets, branch: ${rulesetBranch} `,
      value: true,
    });

    const commitSha = await getFileCommitSha(
      "IATI",
      "IATI-Rulesets",
      rulesetBranch,
      "rulesets/standard.json",
    );

    const ruleset = await getFileBySha(
      "IATI",
      "IATI-Rulesets",
      commitSha,
      "rulesets/standard.json",
    );

    const guidanceLinks = Object.keys(ruleset).reduce((acc, xpath) => {
      Object.keys(ruleset[xpath]).forEach((ruleType) => {
        ruleset[xpath][ruleType].cases.forEach((oneCase) => {
          if (ruleType !== "loop") {
            acc[oneCase.ruleInfo.id] = oneCase.ruleInfo.link;
          } else {
            Object.keys(oneCase.do).forEach((ifThen) => {
              oneCase.do[ifThen].cases.forEach((aCase) => {
                acc[aCase.ruleInfo.id] = aCase.ruleInfo.link;
              });
            });
          }
        });
      });
      return acc;
    }, {});

    context.res = {
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        version,
        commitSha,
        content: guidanceLinks,
      }),
    };
    return;
  } catch (e) {
    context.res = {
      status: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(e),
    };
  }
}
