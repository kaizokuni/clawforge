# stacks/

## Purpose
Template stacks for batch-installing full dev environments. Each .yaml references bundles + hooks + settings + MCPs.

## Integration
Used by `clawforge marketplace install-stack <name>`.

## Key Files
- `web-developer.yaml`, `security-engineer.yaml`, `devops.yaml`, `full-stack.yaml`

## Common Tasks
- Add a new stack: create `stacks/<name>.yaml` referencing bundles, hooks, settings
