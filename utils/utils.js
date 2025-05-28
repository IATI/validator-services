import fetch from "node-fetch";
import config from "../config/config.js";

const GITHUB_API = "https://api.github.com";

const getFileBySha = async (owner, repo, sha, filePath) => {
  const headers = { Accept: "application/vnd.github.raw+json" };
  if (
    config.GITHUB_OAUTH_APP_CLIENT_ID &&
    config.GITHUB_OAUTH_APP_CLIENT_SECRET
  ) {
    headers["Authorization"] =
      "Basic " +
      Buffer.from(
        config.GITHUB_OAUTH_APP_CLIENT_ID +
          ":" +
          config.GITHUB_OAUTH_APP_CLIENT_SECRET,
      ).toString("base64");
  }
  const res = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/contents/${filePath}?ref=${sha}`,
    {
      method: "GET",
      headers: headers,
    },
  );
  // This can be useful to check auth. You should see headers like x-ratelimit-limit, x-ratelimit-remaining
  //console.log(res.headers);
  const body = res.json();
  if (res.status !== 200)
    throw new Error(
      `Error fetching file from github api. Status: ${res.status} Message: ${body.message} `,
    );
  return body;
};

const getFileCommitSha = async (owner, repo, branch, filePath) => {
  const headers = { Accept: "application/vnd.github.v3+json" };
  if (
    config.GITHUB_OAUTH_APP_CLIENT_ID &&
    config.GITHUB_OAUTH_APP_CLIENT_SECRET
  ) {
    headers["Authorization"] =
      "Basic " +
      Buffer.from(
        config.GITHUB_OAUTH_APP_CLIENT_ID +
          ":" +
          config.GITHUB_OAUTH_APP_CLIENT_SECRET,
      ).toString("base64");
  }
  const fileRes = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/commits?sha=${branch}&path=${filePath}`,
    {
      method: "GET",
      headers: headers,
    },
  );
  // This can be useful to check auth. You should see headers like x-ratelimit-limit, x-ratelimit-remaining
  //console.log(fileRes.headers);
  const fileBody = await fileRes.json();
  if (fileRes.status !== 200)
    throw new Error(
      `Error fetching sha from github api. Status: ${fileRes.status} Message: ${fileBody.message} `,
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
