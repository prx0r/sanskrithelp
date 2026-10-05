# SanskritHelp drop-in

Copy the overlay into the root of `prx0r/sanskrithelp`:

```bash
cp -R sanskrithelp_overlay/app ./
cp -R sanskrithelp_overlay/components ./
```

Then visit `/learn/world` and load a compiled `dist/*.world.json` file.

This first overlay is deliberately file-based. The next integration step is an API route that runs the compiler directly from the reading/decompiler screen.
