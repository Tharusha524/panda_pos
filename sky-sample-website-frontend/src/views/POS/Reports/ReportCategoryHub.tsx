import React from "react";
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Grid,
  Typography,
  Button,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { Link as RouterLink, useNavigate, useParams } from "react-router";
import PageTitle from "../../../components/PageTitle";
import { findCategory } from "./reportDefinitions";

const ReportCategoryHub: React.FC = () => {
  const { categoryId = "" } = useParams();
  const navigate = useNavigate();
  const category = findCategory(categoryId);

  if (!category) {
    return (
      <Box sx={{ p: 3 }}>
        <Button component={RouterLink} to="/reports">
          Back to Reports
        </Button>
      </Box>
    );
  }

  const Icon = category.icon;

  return (
    <Box sx={{ p: 3 }}>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate("/reports")} sx={{ mb: 2 }}>
        All Reports
      </Button>

      <PageTitle title={category.title} subtitle={category.description} />

      <Grid container spacing={2}>
        {category.reports.map((report) => (
          <Grid item xs={12} sm={6} md={4} key={report.key}>
            <Card variant="outlined" sx={{ height: "100%" }}>
              <CardActionArea
                component={RouterLink}
                to={`/reports/${categoryId}/${report.key}`}
                sx={{ height: "100%" }}
              >
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                    <Icon color="primary" sx={{ mt: 0.25 }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {report.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {report.description}
                      </Typography>
                    </Box>
                    <ChevronRightIcon color="action" />
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default ReportCategoryHub;
