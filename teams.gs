
  var fetchCachedGitHubTeamSlugs, getGitHubService, githubClientId, githubClientSecret, githubTeamSlugs, loadGitHubTeams, resetGitHubAuthorization;

  githubTeamSlugs = false;

  fetchCachedGitHubTeamSlugs = function() {
    var cache, slugs;
    Logger.log("Trying to load GitHub teams from cache");
    if (githubTeamSlugs) {
      Logger.log("fetchCachedGitHubTeamSlugs: local cache hit");
    } else {
      cache = CacheService.getUserCache();
      githubTeamSlugs = cache.get("github-team-slugs");
      if (githubTeamSlugs) {
        Logger.log("fetchCachedGitHubTeamSlugs: cache hit");
      } else {
        Logger.log("fetchCachedGitHubTeamSlugs: cache miss");
        slugs = loadGitHubTeams();
        if (slugs === "err") {
          return "err";
        }
        githubTeamSlugs = slugs;
        cache.put("github-team-slugs", slugs, 3600);
      }
    }
    return githubTeamSlugs;
  };

  loadGitHubTeams = function() {
    var githubService, response, t, teamSlugs, teams;
    Logger.log("loadGitHubTeams: Loading GitHub teams from the API");
    githubService = getGitHubService();
    if (!githubService.hasAccess() || !githubService.getAccessToken()) {
      Logger.log("loadGitHubTeams: Missing Oauth authorization");
      return "err";
    }
    response = UrlFetchApp.fetch("https://api.github.com/user/teams", {
      headers: {
        Authorization: "token " + (githubService.getAccessToken())
      }
    });
    if (response.getResponseCode() !== 200) {
      Logger.log("loadGitHubTeams: Non 200 response from the GitHub API");
      return "err";
    }
    teams = JSON.parse(response.getContentText());
    teamSlugs = [
      (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = teams.length; _i < _len; _i++) {
          t = teams[_i];
          _results.push("@" + t["organization"]["login"] + "/" + t["slug"]);
        }
        return _results;
      })()
    ];
    Logger.log("loadGitHubTeams: Loaded teams from GitHub API: ", teamSlugs);
    return teamSlugs;
  };

  getGitHubService = function() {
    return OAuth2.createService('github').setAuthorizationBaseUrl('https://github.com/login/oauth/authorize').setTokenUrl('https://github.com/login/oauth/access_token').setClientId(githubClientId()).setClientSecret(githubClientSecret()).setProjectKey('M0FjeQ5yKTbPoxSB2lDmzPjxjc-ysB9lY').setCallbackFunction('authCallback').setPropertyStore(PropertiesService.getUserProperties()).setScope('user');
  };

  githubClientId = function() {
    return PropertiesService.getScriptProperties().getProperty("github_client_id");
  };

  githubClientSecret = function() {
    return PropertiesService.getScriptProperties().getProperty("github_client_secret");
  };

  resetGitHubAuthorization = function() {
    var githubService;
    githubService = getGitHubService();
    return githubService.reset();
  };


