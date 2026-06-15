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

  enterShell = ''
    echo "ChronoCal dev shell ready"
    echo "Node: $(node --version)"
    echo "npm:  $(npm --version)"
    echo "Use:  npx @google/clasp <command>"
  '';
}