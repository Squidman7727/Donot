import { Config } from "@remotion/cli/config";
Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(92);
Config.setConcurrency(4);
// 3D styles (2, 4, 6) also need: Config.setChromiumOpenGlRenderer("angle");
