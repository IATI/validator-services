import fetch from "node-fetch";
import config from "../config/config.js";

const GITHUB_RAW = "https://raw.githubusercontent.com";
const GITHUB_API = "https://api.github.com";

const getFileBySha = async (owner, repo, sha, filePath) => {
  // https://raw.githubusercontent.com/IATI/IATI-Codelists/34a421386d554ccefbb4067b8fc21493c562a793/codelist_rules.json
  const res = await fetch(`${GITHUB_RAW}/${owner}/${repo}/${sha}/${filePath}`, {
    method: "GET",
    headers: {
      Accept: "text/plain",
      Authorization: `Basic ${config.GITHUB_BASIC_TOKEN}`,
    },
  });
  const body = res.json();
  if (res.status !== 200)
    throw new Error(
      `Error fetching file from github api. Status: ${res.status} Message: ${body.message} `,
    );
  return body;
};

const getFileCommitSha = async (owner, repo, branch, filePath) => {
  // https://api.github.com/repos/IATI/IATI-Codelists/branches/v2.03/validatorCodelist
  const branchRes = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/branches/${branch}`,
    {
      method: "GET",
      headers: {
        Accept: "application/vnd.github.v3+json",
        Authorization: `Basic ${config.GITHUB_BASIC_TOKEN}`,
      },
    },
  );
  const branchBody = await branchRes.json();
  if (branchRes.status !== 200)
    throw new Error(
      `Error fetching sha from github api. Status: ${branchRes.status} Message: ${branchBody.message} `,
    );
  const { sha } = branchBody.commit;
  // https://api.github.com/repos/IATI/IATI-Codelists/commits?sha=2ad9521a0e7604f44e4df33a8a8699927941e177&path=codelist_rules.json
  const fileRes = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/commits?sha=${sha}&path=${filePath}`,
    {
      method: "GET",
      headers: {
        Accept: "application/vnd.github.v3+json",
        Authorization: `Basic ${config.GITHUB_BASIC_TOKEN}`,
      },
    },
  );
  const fileBody = await fileRes.json();
  if (fileRes.status !== 200)
    throw new Error(
      `Error fetching sha from github api. Status: ${branchRes.status} Message: ${fileBody.message} `,
    );
  // sort to get newest commit
  fileBody.sort(
    (first, second) =>
      new Date(second.commit.committer.date) -
      new Date(first.commit.committer.date),
  );
  return fileBody[0].sha;
};

class HTTPResponseError extends Error {
  constructor(response, ...args) {
    super(
      `HTTP Error Response: ${response.status} ${response.statusText}`,
      ...args,
    );
    this.response = response;
  }
}

const checkRespStatus = (response) => {
  if (response.ok) {
    // response.status >= 200 && response.status < 300
    return response;
  }
  throw new HTTPResponseError(response);
};

export { checkRespStatus, getFileBySha, getFileCommitSha };
