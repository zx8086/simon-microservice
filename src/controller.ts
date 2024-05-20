import Elysia from 'elysia';
const app = new Elysia();

export const controller = (app: Elysia): void => {
  app.get("/health",
      async (context) : Promise<any> => {

        return {
          "message": "Application HEALTHY"
        };
  });
};

controller(app);