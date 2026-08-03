import React from "react";
import { Box, Card, CardActionArea, CardContent, Grid, Typography } from "@mui/material";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { Link as RouterLink } from "react-router";
import PageTitle from "../../../components/PageTitle";
import { REPORT_CATEGORIES } from "./reportDefinitions";

const ReportHub: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <PageTitle
        title="Reports"
        subtitle="Select a category and report. Filter by date and branch (Main Location or any branch) — all data updates branch-wise."
      />

      <Grid container spacing={3}>
        {REPORT_CATEGORIES.map((category) => {
          const Icon = category.icon;
          return (
            <Grid item xs={12} sm={6} md={4} key={category.id}>
              <Card
                variant="outlined"
                sx={{
                  height: "100%",
                  transition: "box-shadow 0.2s",
                  "&:hover": { boxShadow: 4 },
                }}
              >
                <CardActionArea
                  component={RouterLink}
                  to={`/reports/${category.id}`}
                  sx={{ height: "100%", p: 2 }}
                >
                  <CardContent>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
                      <Box
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          bgcolor: "primary.main",
                          color: "primary.contrastText",
                          display: "flex",
                        }}
                      >
                        <Icon />
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" fontWeight={700}>
                          {category.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {category.reports.length} reports
                        </Typography>
                      </Box>
                      <ChevronRightIcon />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {category.description}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};

export default ReportHub;
