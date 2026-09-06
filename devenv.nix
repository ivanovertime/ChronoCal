{ pkgs, ... }:
{
  packages = with pkgs; [
    nodejs_22
    git
    jq
    nixfmt
  ];

  env = {
    CHRONOCAL_ROOT = "${toString ./.}";
  };

  scripts.clasp-push.exec = "npx @google/clasp push";

  enterShell = ''
    echo "ChronoCal dev shell ready"
    echo "Node: $(node --version)"
    echo "npm:  $(npm --version)"
    echo "Use:  npx @google/clasp <command>"
  '';
}
