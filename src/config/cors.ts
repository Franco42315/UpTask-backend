import { CorsOptions } from "cors";

export const corsConfig: CorsOptions = {
  origin: function (origin, callback) {
    const whitelist = [process.env.URL_FRONT];
    if (process.argv.includes("--api")) {
      whitelist.push(undefined);
    }

    if (whitelist.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Error de CORS"));
    }
  },
};

// import { CorsOptions } from "cors";

// export const corsConfig: CorsOptions = {
//   origin: '*', // Permitir todos los orígenes
// };
