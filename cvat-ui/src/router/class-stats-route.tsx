import React from 'react';
import { Route } from 'react-router-dom';
import ClassStatsPage from '../components/class-stats-page/ClassStatsPage';

const ClassStatsRoute = () => (
  <Route exact path="/test/stats" component={ClassStatsPage} />
);

export default ClassStatsRoute;