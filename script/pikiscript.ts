const PikiScript = {
  output: "",
  script: "",
  data: null,
  baseUrl: "https://pikidiary-api.vercel.app",

  execute: function(script) {
    return new Promise((resolve) => {
      this.output = "";
      this.script = script;
      this.data = null;

      if (!this.script.includes("init():") || !this.script.includes("end")) {
        this.addOutput("error: missing init(): or end");
        resolve(this.output);
        return;
      }

      const usernameMatch = this.script.match(/getuser\.from\((.*?)\)/);
      if (!usernameMatch) {
        this.addOutput("error: no valid 'getuser.from(URL)' found");
        resolve(this.output);
        return;
      }

      let url = usernameMatch[1].trim().replace(/['"]/g, '');

      if (!url.startsWith(this.baseUrl)) {
        this.addOutput(`error: URL must start with ${this.baseUrl}`);
        resolve(this.output);
        return;
      }

      this.fetchData(url)
        .then(data => {
          this.data = data;
          this.processScript();
          resolve(this.output);
        })
        .catch(error => {
          this.addOutput(`error: ${error.message}`);
          resolve(this.output);
        });
    });
  },

  loadApikiFile: function(file) {
    return new Promise((resolve, reject) => {
      let fileName = '';

      if (typeof File !== 'undefined' && file instanceof File) {
        fileName = file.name;
      } else if (typeof file === 'string') {
        fileName = file;
      } else {
        reject(new Error("unsupported file type"));
        return;
      }

      if (!fileName.toLowerCase().endsWith('.apiki')) {
        reject(new Error("file must have a .apiki extension"));
        return;
      }

      if (typeof File !== 'undefined' && file instanceof File) {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result);
        reader.onerror = (e) => reject(new Error("file reading failed"));
        reader.readAsText(file);
      } else if (typeof require !== 'undefined') {
        try {
          const fs = require('fs');
          fs.readFile(file, 'utf8', (err, data) => {
            if (err) reject(err);
            else resolve(data);
          });
        } catch (e) {
          reject(new Error("file system access not available"));
        }
      } else {
        reject(new Error("file loading not supported in this environment"));
      }
    });
  },

  fetchData: function(url) {
    return new Promise((resolve, reject) => {
      fetch(url, {
        headers: {
          "Accept": "application/json"
        }
      })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => resolve(data))
      .catch(error => reject(new Error(`request failed: ${error.message}`)));
    });
  },

  processScript: function() {
    if (!this.data) return;

    const posts = this.data.posts || [];

    for (const post of posts) {
      if (this.script.includes("print.age")) {
        this.addOutput(`AGE: ${post.createdAt || 'N/A'}`);
      }
      if (this.script.includes("print.own")) {
        this.addOutput(`BY: ${post.author || 'N/A'}`);
      }
      if (this.script.includes("print.cont")) {
        this.addOutput(`${post.content || ''}`);
      }
      if (this.script.includes("print.likes")) {
        this.addOutput(`Likes: ${post.likes || 0}`);
      }
      if (this.script.includes("print.url")) {
        this.addOutput(`URL: ${post.url || ''}`);
      }
      if (this.script.includes("print_sep")) {
        this.addOutput("-----------------------------");
      }
    }
  },

  addOutput: function(text) {
    this.output += text + "\n";
  }
};

const script = `
init():
  getuser.from("https://pikidiary-api.vercel.app/?username=squirrel&show=posts")
  print.url
end
`;

PikiScript.execute(script).then(result => {
  console.log(result);
});
