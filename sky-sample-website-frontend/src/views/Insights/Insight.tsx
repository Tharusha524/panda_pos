import React from "react";
import {
  Box,
  Stack,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Grid,
  Divider,
  Chip,
} from "@mui/material";
import useCurrentUser from "../../hooks/useCurrentUser";
import { APP_INFO } from "../../config/appInfo";

function Insight() {
  const { user } = useCurrentUser();

  return (
    <Stack spacing={3} sx={{ p: 2 }}>
      <Box>
        <Typography
          variant="h4"
          align="left"
          sx={{ fontWeight: 700, color: "var(--pallet-orange)" }}
        >
          Home Dashboard
        </Typography>
        <Typography variant="subtitle1" sx={{ color: "var(--pallet-main-blue)" }}>
          {user ? `Welcome back, ${user.name}` : "Practice running your store with our demo content."}
        </Typography>
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={12} md={8}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Quick Actions
              </Typography>
              <Divider sx={{ my: 1 }} />

              <Grid container spacing={1} sx={{ mt: 1 }}>
                <Grid item xs={12} sm={6}>
                  <Card variant="outlined" sx={{ p: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      Practice making some sales
                    </Typography>
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                      Try making a few sales to get a feel for the day-to-day running of your store.
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      <Chip label="sampleProduct" color="primary" />
                    </Box>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Card variant="outlined" sx={{ p: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      Run Reports
                    </Typography>
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                      Once you've made some sales, see how Reporting can help you track performance.
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      <Chip label="sampleProduct" color="primary" />
                    </Box>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Card variant="outlined" sx={{ p: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      Add Products
                    </Typography>
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                      Try adding a few products to your catalog, either one-by-one or in bulk.
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      <Chip label="sampleProduct" color="primary" />
                    </Box>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Card variant="outlined" sx={{ p: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      Ready to set up?
                    </Typography>
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                      We'll help you move into a brand new store so you can set everything up and get selling quickly.
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      <Button variant="contained" color="primary" size="small">
                        I'm Ready!
                      </Button>
                    </Box>
                  </Card>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card elevation={1} sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Quickstart & Support
              </Typography>
              <Divider sx={{ my: 1 }} />
              <Typography variant="body2" sx={{ mb: 1 }}>
                The quickstart guide will help you configure {APP_INFO.applicationName} for your store so you can start selling on time.
              </Typography>
              <Button size="small">Start Guide</Button>

              <Divider sx={{ my: 1 }} />
              <Typography variant="body2" sx={{ mb: 1 }}>
                Need Technical Support? 24/7 global customer support is ready to help.
              </Typography>
              <Button size="small">Get Help</Button>

              <Divider sx={{ my: 1 }} />
              <Typography variant="body2" sx={{ mb: 1 }}>
                Connect your online store — sync orders and inventory across locations when integrations are enabled.
              </Typography>
              <Button size="small">Visit Site</Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Tips
          </Typography>
          <Divider sx={{ my: 1 }} />
          <Typography variant="body2" sx={{ mb: 1 }}>
            {APP_INFO.applicationName} makes it simple to record business expenses and income. Entering your income and costs gives you a more complete overview of your profits.
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Enter the basic customer's information. Customer name and contact number are mandatory.
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            If you receive items from your Suppliers for inventory purposes, enter the item details through Receive Inventory.
          </Typography>
        </CardContent>
        <CardActions>
          <Typography variant="caption" sx={{ ml: 1 }}>
            Progress: 5 / 5
          </Typography>
          <Box sx={{ flex: 1 }} />
          <Button size="small">Find out more</Button>
        </CardActions>
      </Card>
    </Stack>
  );
}

export default Insight;
