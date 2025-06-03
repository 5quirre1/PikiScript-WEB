// compiled to js

var PikiScript = {
    output: "",
    script: "",
    data: null,
    baseUrl: "https://pikidiary-api.vercel.app",
    execute: function (script) {
        var _this = this;
        return new Promise(function (resolve) {
            _this.output = "";
            _this.script = script;
            _this.data = null;
            if (!_this.script.includes("init():") || !_this.script.includes("end")) {
                _this.addOutput("error: missing init(): or end");
                resolve(_this.output);
                return;
            }
            var usernameMatch = _this.script.match(/getuser\.from\((.*?)\)/);
            if (!usernameMatch) {
                _this.addOutput("error: no valid 'getuser.from(URL)' found");
                resolve(_this.output);
                return;
            }
            var url = usernameMatch[1].trim().replace(/['"]/g, '');
            if (!url.startsWith(_this.baseUrl)) {
                _this.addOutput("error: URL must start with ".concat(_this.baseUrl));
                resolve(_this.output);
                return;
            }
            _this.fetchData(url)
                .then(function (data) {
                _this.data = data;
                _this.processScript();
                resolve(_this.output);
            })
                .catch(function (error) {
                _this.addOutput("Error: ".concat(error.message));
                resolve(_this.output);
            });
        });
    },
    loadApikiFile: function (file) {
        return new Promise(function (resolve, reject) {
            if (typeof File !== 'undefined' && file instanceof File) {
                var reader = new FileReader();
                reader.onload = function (e) { var _a; return resolve((_a = e.target) === null || _a === void 0 ? void 0 : _a.result); };
                reader.onerror = function (e) { return reject(new Error("file reading failed")); };
                reader.readAsText(file);
            }
            else if (typeof require !== 'undefined') {
                try {
                    var fs = require('fs');
                    fs.readFile(file, 'utf8', function (err, data) {
                        if (err)
                            reject(err);
                        else
                            resolve(data);
                    });
                }
                catch (e) {
                    reject(new Error("file system access not available"));
                }
            }
            else {
                reject(new Error("file loading not supported in this environment"));
            }
        });
    },
    fetchData: function (url) {
        return new Promise(function (resolve, reject) {
            var xhr = new XMLHttpRequest();
            xhr.open("GET", url, true);
            xhr.setRequestHeader("Accept", "application/json");
            xhr.onload = function () {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        var data = JSON.parse(xhr.responseText);
                        resolve(data);
                    }
                    catch (e) {
                        reject(new Error("failed to parse JSON response"));
                    }
                }
                else {
                    reject(new Error("request failed with status ".concat(xhr.status)));
                }
            };
            xhr.onerror = function () {
                reject(new Error("request failed"));
            };
            xhr.send();
        });
    },
    processScript: function () {
        if (!this.data)
            return;
        var posts = this.data.posts || [];
        for (var _i = 0, posts_1 = posts; _i < posts_1.length; _i++) {
            var post = posts_1[_i];
            if (this.script.includes("print.age")) {
                this.addOutput("AGE: ".concat(post.createdAt || 'N/A'));
            }
            if (this.script.includes("print.own")) {
                this.addOutput("BY: ".concat(post.author || 'N/A'));
            }
            if (this.script.includes("print.cont")) {
                this.addOutput("".concat(post.content || ''));
            }
            if (this.script.includes("print.likes")) {
                this.addOutput("Likes: ".concat(post.likes || 0));
            }
            if (this.script.includes("print.url")) {
                this.addOutput("URL: ".concat(post.url || ''));
            }
            if (this.script.includes("print_sep")) {
                this.addOutput("-----------------------------");
            }
        }
    },
    addOutput: function (text) {
        this.output += text + "\n";
    }
};
var script = "\ninit():\n  getuser.from(\"https://pikidiary-api.vercel.app/?username=squirrel&show=posts\")\n  print.url\nend\n";
PikiScript.execute(script).then(function (result) {
    console.log(result);
});
