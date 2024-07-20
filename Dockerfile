FROM node
RUN ["npm","install"]
CMD ["node","app.js"]