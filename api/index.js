import express, { Router } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { v4 } from "uuid";
import { z } from "zod";
import { Resend } from "resend";
//#region server/src/config/env.ts
if (typeof dotenv?.config === "function") dotenv.config();
var env = {
	PORT: process.env.PORT || 3001,
	SUPABASE_URL: process.env.SUPABASE_URL,
	SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
	SUPABASE_JWT_SECRET: process.env.SUPABASE_JWT_SECRET,
	RESEND_API_KEY: process.env.RESEND_API_KEY,
	ZEFFY_WEBHOOK_SECRET: process.env.ZEFFY_WEBHOOK_SECRET,
	CORS_ORIGIN: process.env.CORS_ORIGIN || "*"
};
if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
	console.error("🚨 CRITICAL ERROR: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment variables!");
	console.error("Please add them to your Vercel Project Settings > Environment Variables.");
}
//#endregion
//#region server/src/lib/supabase.ts
var url$1 = env.SUPABASE_URL || "https://placeholder.supabase.co";
var key$1 = env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-service-role-key";
var supabase = createClient(url$1, key$1, { auth: {
	autoRefreshToken: false,
	persistSession: false
} });
//#endregion
//#region server/src/services/auditService.ts
var logAudit = async (actor_id, action, entity_type, entity_id, details = {}) => {
	try {
		const isDemoAdmin = actor_id === "admin-demo-id";
		const finalActorId = isDemoAdmin ? null : actor_id;
		if (isDemoAdmin) details.actor_name = "Demo Admin";
		const { error } = await supabase.from("audits").insert({
			id: v4(),
			actor_id: finalActorId,
			action,
			entity_type,
			entity_id,
			details
		});
		if (error) console.error("Audit insert error:", error.message, error.details);
	} catch (error) {
		console.error("Audit log failed:", error);
	}
};
//#endregion
//#region server/src/services/matchingEngine.ts
var DAY_NAMES = [
	"Sunday",
	"Monday",
	"Tuesday",
	"Wednesday",
	"Thursday",
	"Friday",
	"Saturday"
];
function getRequiredDayName(dateStr) {
	if (!dateStr) return null;
	try {
		return DAY_NAMES[new Date(dateStr).getDay()];
	} catch {
		return null;
	}
}
function checkAvailability(volunteerAvailability, requiredDay) {
	if (!volunteerAvailability || !requiredDay) return false;
	const avail = volunteerAvailability.toLowerCase();
	const day = requiredDay.toLowerCase();
	if (avail.includes(day)) return true;
	if (avail.includes("weekday") && [
		"monday",
		"tuesday",
		"wednesday",
		"thursday",
		"friday"
	].includes(day)) return true;
	if (avail.includes("weekend") && ["saturday", "sunday"].includes(day)) return true;
	if (avail.includes("anytime") || avail.includes("flexible") || avail.includes("any")) return true;
	return false;
}
function matchVolunteers(request, volunteers) {
	const requiredDay = getRequiredDayName(request.required_date);
	return volunteers.filter((v) => v.status === "available").map((v) => {
		let score = 0;
		const details = {
			skill_matches: [],
			interest_matches: [],
			location_match: false,
			availability_match: false
		};
		if (request.required_skills && v.skills) {
			const reqSkills = request.required_skills.map((s) => s.toLowerCase());
			const volSkills = v.skills.map((s) => s.toLowerCase());
			const matches = reqSkills.filter((s) => volSkills.includes(s));
			details.skill_matches = matches;
			score += matches.length * 20;
		}
		if (request.required_interests && v.interests) {
			const reqInterests = request.required_interests.map((i) => i.toLowerCase());
			const volInterests = v.interests.map((i) => i.toLowerCase());
			const matches = reqInterests.filter((i) => volInterests.includes(i));
			details.interest_matches = matches;
			score += matches.length * 10;
		}
		if (v.location && request.location && v.location.toLowerCase().trim() === request.location.toLowerCase().trim()) {
			details.location_match = true;
			score += 30;
		}
		if (checkAvailability(v.availability, requiredDay)) {
			details.availability_match = true;
			score += 20;
		}
		return {
			...v,
			match_score: score,
			match_details: details
		};
	}).filter((m) => m.match_score > 0).sort((a, b) => b.match_score - a.match_score);
}
//#endregion
//#region server/src/routes/admin.ts
var router$8 = Router();
router$8.get("/overview", async (req, res) => {
	try {
		const [{ count: totalOrphanages }, { count: pendingOrphanages }, { count: approvedOrphanages }, { count: activeCampaigns }, { count: pendingCampaigns }, { count: totalVolunteers }, { count: activeRequests }, { count: pendingNeeds }, { data: donationStats }, { count: pendingPayments }] = await Promise.all([
			supabase.from("orphanages").select("*", {
				count: "exact",
				head: true
			}),
			supabase.from("orphanages").select("*", {
				count: "exact",
				head: true
			}).eq("verification_status", "pending"),
			supabase.from("orphanages").select("*", {
				count: "exact",
				head: true
			}).eq("verification_status", "approved"),
			supabase.from("campaigns").select("*", {
				count: "exact",
				head: true
			}).eq("status", "active"),
			supabase.from("campaigns").select("*", {
				count: "exact",
				head: true
			}).eq("status", "pending"),
			supabase.from("volunteers").select("*", {
				count: "exact",
				head: true
			}),
			supabase.from("volunteer_requests").select("*", {
				count: "exact",
				head: true
			}).in("status", [
				"pending",
				"approved",
				"matching",
				"matched",
				"assigned"
			]),
			supabase.from("needs").select("*", {
				count: "exact",
				head: true
			}).eq("status", "pending"),
			supabase.from("donations").select("amount").eq("status", "completed"),
			supabase.from("payments").select("*", {
				count: "exact",
				head: true
			}).eq("status", "pending")
		]);
		const totalDonations = (donationStats || []).reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0);
		res.json({
			success: true,
			data: {
				total_donations: totalDonations,
				active_campaigns: activeCampaigns || 0,
				verified_orphanages: approvedOrphanages || 0,
				pending_orphanages: pendingOrphanages || 0,
				total_volunteers: totalVolunteers || 0,
				active_volunteer_requests: activeRequests || 0,
				totalOrphanages: totalOrphanages || 0,
				pendingOrphanages: pendingOrphanages || 0,
				approvedOrphanages: approvedOrphanages || 0,
				activeCampaigns: activeCampaigns || 0,
				pendingCampaigns: pendingCampaigns || 0,
				totalVolunteers: totalVolunteers || 0,
				activeRequests: activeRequests || 0,
				pendingNeeds: pendingNeeds || 0,
				totalDonations,
				pendingPayments: pendingPayments || 0
			}
		});
	} catch (err) {
		res.status(500).json({
			success: false,
			error: err.message
		});
	}
});
router$8.get("/orphanages", async (req, res) => {
	const { status } = req.query;
	let query = supabase.from("orphanages").select("*").order("created_at", { ascending: false });
	if (status && status !== "all") query = query.eq("verification_status", status);
	const { data, error } = await query;
	res.json({
		success: !error,
		data: data || [],
		error: error?.message
	});
});
router$8.put("/orphanages/:id/review", async (req, res) => {
	const { status, rejection_reason } = req.body;
	const { id } = req.params;
	const user = req.user;
	const payload = {
		verification_status: status,
		rejection_reason: rejection_reason || null,
		reviewed_at: (/* @__PURE__ */ new Date()).toISOString()
	};
	if (user.id !== "admin-demo-id") payload.reviewed_by = user.id;
	const { data, error } = await supabase.from("orphanages").update(payload).eq("id", id).select().single();
	if (error) return res.json({
		success: false,
		data: null,
		error: error.message
	});
	if (data?.profile_id) {
		const newRole = status === "approved" ? "orphanage" : "donor";
		let clientToUse = supabase;
		const authHeader = req.headers.authorization;
		if (authHeader && authHeader !== "Bearer admin-demo-token") clientToUse = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { global: { headers: { Authorization: authHeader } } });
		else try {
			const { data: linkData } = await supabase.auth.admin.generateLink({
				type: "magiclink",
				email: "anishjrall@gmail.com"
			});
			if (linkData?.properties?.email_otp) {
				const { data: sess } = await supabase.auth.verifyOtp({
					email: "anishjrall@gmail.com",
					token: linkData.properties.email_otp,
					type: "email"
				});
				if (sess?.session?.access_token) clientToUse = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { global: { headers: { Authorization: `Bearer ${sess.session.access_token}` } } });
			}
		} catch (adminAuthErr) {
			console.warn("Failed to acquire admin user token for profile role update:", adminAuthErr);
		}
		const { error: roleErr } = await clientToUse.from("profiles").update({
			role: newRole,
			updated_at: (/* @__PURE__ */ new Date()).toISOString()
		}).eq("id", data.profile_id);
		if (roleErr) console.error("Failed to update profile role:", roleErr.message);
	}
	await logAudit(user.id, `orphanage_${status}`, "orphanages", id, {
		status,
		rejection_reason
	});
	res.json({
		success: true,
		data,
		error: null
	});
});
router$8.delete("/orphanages/:id", async (req, res) => {
	const { id } = req.params;
	const user = req.user;
	const { error } = await supabase.from("orphanages").delete().eq("id", id);
	if (!error) await logAudit(user.id, `orphanage_deleted`, "orphanages", id, {});
	res.json({
		success: !error,
		error: error?.message
	});
});
router$8.get("/orphanages/:id", async (req, res) => {
	const { id } = req.params;
	const { data, error } = await supabase.from("orphanages").select("*").eq("id", id).single();
	res.json({
		success: !error,
		data,
		error: error?.message
	});
});
router$8.get("/campaigns", async (req, res) => {
	const { status } = req.query;
	let query = supabase.from("campaigns").select("*, orphanage:orphanages(name, city)").order("created_at", { ascending: false });
	if (status && status !== "all") query = query.eq("status", status);
	const { data, error } = await query;
	res.json({
		success: !error,
		data: data || [],
		error: error?.message
	});
});
router$8.put("/campaigns/:id", async (req, res) => {
	const { id } = req.params;
	const user = req.user;
	const updates = req.body;
	const { error } = await supabase.from("campaigns").update(updates).eq("id", id);
	if (!error) await logAudit(user.id, "campaign_updated", "campaigns", id, updates);
	res.json({
		success: !error,
		error: error?.message
	});
});
router$8.post("/campaigns", async (req, res) => {
	const { title, description, goal_amount, image_url, currency, end_date, zeffy_url } = req.body;
	const user = req.user;
	const payload = {
		title,
		description: description || "",
		goal_amount: parseFloat(goal_amount) || 1e3,
		raised_amount: 0,
		currency: currency || "USD",
		status: "active",
		image_url: image_url || null,
		end_date: end_date || null,
		orphanage_id: "0c9d2161-576a-4acb-9bd3-595de1bf63b6"
	};
	if (zeffy_url) payload.zeffy_url = zeffy_url;
	const { data, error } = await supabase.from("campaigns").insert([payload]).select().single();
	if (error) {
		console.error("Campaign insert error:", error.message);
		return res.json({
			success: false,
			data: null,
			error: error.message
		});
	}
	await logAudit(user.id, "campaign_created", "campaigns", data.id, payload);
	res.json({
		success: true,
		data,
		error: null
	});
});
router$8.put("/campaigns/:id/review", async (req, res) => {
	const { status, rejection_reason } = req.body;
	const { id } = req.params;
	const user = req.user;
	const payload = {
		status,
		rejection_reason: rejection_reason || null,
		reviewed_at: (/* @__PURE__ */ new Date()).toISOString()
	};
	if (user.id !== "admin-demo-id") payload.reviewed_by = user.id;
	const { data, error } = await supabase.from("campaigns").update(payload).eq("id", id).select().single();
	if (data) await logAudit(user.id, `campaign_${status}`, "campaigns", id, {
		status,
		rejection_reason
	});
	res.json({
		success: !error,
		data,
		error: error?.message
	});
});
router$8.get("/needs", async (req, res) => {
	const { status } = req.query;
	let query = supabase.from("needs").select("*, orphanage:orphanages(name, city)").order("created_at", { ascending: false });
	if (status && status !== "all") query = query.eq("status", status);
	const { data, error } = await query;
	res.json({
		success: !error,
		data: data || [],
		error: error?.message
	});
});
router$8.put("/needs/:id/review", async (req, res) => {
	const { status, rejection_reason } = req.body;
	const { id } = req.params;
	const user = req.user;
	const payload = {
		status,
		rejection_reason: rejection_reason || null,
		reviewed_at: (/* @__PURE__ */ new Date()).toISOString()
	};
	if (user.id !== "admin-demo-id") payload.reviewed_by = user.id;
	const { data, error } = await supabase.from("needs").update(payload).eq("id", id).select().single();
	if (data) await logAudit(user.id, `need_${status}`, "needs", id, {
		status,
		rejection_reason
	});
	res.json({
		success: !error,
		data,
		error: error?.message
	});
});
router$8.get("/volunteers", async (req, res) => {
	const { status } = req.query;
	let query = supabase.from("volunteers").select("*, profiles!volunteers_profile_id_fkey(full_name)").order("created_at", { ascending: false });
	if (status && status !== "all") query = query.eq("status", status);
	const { data, error } = await query;
	res.json({
		success: !error,
		data: data || [],
		error: error?.message
	});
});
router$8.put("/volunteers/:id/review", async (req, res) => {
	const { status } = req.body;
	const { id } = req.params;
	const user = req.user;
	const payload = {
		status,
		reviewed_at: (/* @__PURE__ */ new Date()).toISOString()
	};
	if (user.id !== "admin-demo-id") payload.reviewed_by = user.id;
	const { data, error } = await supabase.from("volunteers").update(payload).eq("id", id).select().single();
	if (data) await logAudit(user.id, `volunteer_${status}`, "volunteers", id, { status });
	res.json({
		success: !error,
		data,
		error: error?.message
	});
});
router$8.get("/volunteer-requests", async (req, res) => {
	const { status } = req.query;
	let query = supabase.from("volunteer_requests").select("*, orphanage:orphanages(name, city)").order("created_at", { ascending: false });
	if (status && status !== "all") query = query.eq("status", status);
	const { data, error } = await query;
	res.json({
		success: !error,
		data: data || [],
		error: error?.message
	});
});
router$8.put("/volunteer-requests/:id/review", async (req, res) => {
	const { status, rejection_reason } = req.body;
	const { id } = req.params;
	const user = req.user;
	const payload = {
		status,
		rejection_reason: rejection_reason || null,
		reviewed_at: (/* @__PURE__ */ new Date()).toISOString()
	};
	if (user.id !== "admin-demo-id") payload.reviewed_by = user.id;
	const { data, error } = await supabase.from("volunteer_requests").update(payload).eq("id", id).select().single();
	if (data) await logAudit(user.id, `volunteer_request_${status}`, "volunteer_requests", id, {
		status,
		rejection_reason
	});
	res.json({
		success: !error,
		data,
		error: error?.message
	});
});
router$8.post("/volunteer-requests/:id/assign", async (req, res) => {
	const { id } = req.params;
	const { volunteer_id } = req.body;
	const user = req.user;
	try {
		const { data: request, error: reqError } = await supabase.from("volunteer_requests").select("*").eq("id", id).single();
		if (reqError || !request) return res.status(404).json({
			success: false,
			error: "Request not found"
		});
		const { data: assignment, error: assignError } = await supabase.from("volunteer_assignments").insert({
			request_id: id,
			volunteer_id,
			match_score: 100,
			status: "assigned",
			scheduled_date: request.required_date,
			start_time: request.start_time,
			end_time: request.end_time
		}).select().single();
		if (assignError) return res.status(500).json({
			success: false,
			error: assignError.message
		});
		await supabase.from("volunteer_requests").update({ status: "assigned" }).eq("id", id);
		await logAudit(user.id, "manual_assignment", "volunteer_requests", id, { assigned_volunteer_id: volunteer_id });
		res.json({
			success: true,
			data: assignment
		});
	} catch (err) {
		res.status(500).json({
			success: false,
			error: err.message
		});
	}
});
router$8.post("/volunteer-requests/:id/match", async (req, res) => {
	const { id } = req.params;
	const user = req.user;
	try {
		const { data: request, error: reqError } = await supabase.from("volunteer_requests").select("*").eq("id", id).single();
		if (reqError || !request) return res.status(404).json({
			success: false,
			error: "Request not found"
		});
		await supabase.from("volunteer_requests").update({ status: "matching" }).eq("id", id);
		const { data: volunteers } = await supabase.from("volunteers").select("*").eq("status", "available");
		const matches = matchVolunteers(request, volunteers || []);
		if (matches.length === 0) {
			await supabase.from("volunteer_requests").update({ status: "approved" }).eq("id", id);
			return res.json({
				success: true,
				data: {
					matches: [],
					message: "No suitable volunteers found"
				}
			});
		}
		const topMatch = matches[0];
		const { data: assignment, error: assignError } = await supabase.from("volunteer_assignments").insert({
			request_id: id,
			volunteer_id: topMatch.id,
			match_score: topMatch.match_score,
			status: "assigned",
			scheduled_date: request.required_date,
			start_time: request.start_time,
			end_time: request.end_time
		}).select().single();
		if (assignError) {
			await supabase.from("volunteer_requests").update({ status: "approved" }).eq("id", id);
			return res.status(500).json({
				success: false,
				error: assignError.message
			});
		}
		await supabase.from("volunteer_requests").update({ status: "assigned" }).eq("id", id);
		await logAudit(user.id, "trigger_matching", "volunteer_requests", id, {
			top_match_volunteer_id: topMatch.id,
			match_score: topMatch.match_score,
			total_candidates: matches.length
		});
		res.json({
			success: true,
			data: {
				assignment,
				candidates: matches.slice(0, 5),
				message: `Matched and assigned to volunteer with score ${topMatch.match_score}`
			}
		});
	} catch (err) {
		res.status(500).json({
			success: false,
			error: err.message
		});
	}
});
router$8.get("/donations", async (req, res) => {
	const { data, error } = await supabase.from("donations").select("*, campaign:campaigns(title, orphanage:orphanages(name)), payment:payments(*)").order("created_at", { ascending: false });
	res.json({
		success: !error,
		data: data || [],
		error: error?.message
	});
});
router$8.get("/payments", async (req, res) => {
	const { data, error } = await supabase.from("payments").select("*, donation:donations(amount, currency, campaign:campaigns(title))").order("created_at", { ascending: false });
	res.json({
		success: !error,
		data: data || [],
		error: error?.message
	});
});
router$8.get("/receipts", async (req, res) => {
	const { data, error } = await supabase.from("receipts").select("*").order("created_at", { ascending: false });
	res.json({
		success: !error,
		data: data || [],
		error: error?.message
	});
});
router$8.get("/audits", async (req, res) => {
	const { data, error } = await supabase.from("audits").select("*, profiles:actor_id(full_name)").order("created_at", { ascending: false }).limit(200);
	res.json({
		success: !error,
		data: data || [],
		error: error?.message
	});
});
router$8.get("/users", async (req, res) => {
	const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
	res.json({
		success: !error,
		data: data || [],
		error: error?.message
	});
});
router$8.put("/users/:id/role", async (req, res) => {
	const { id } = req.params;
	const { role } = req.body;
	const user = req.user;
	if (![
		"admin",
		"donor",
		"orphanage",
		"volunteer"
	].includes(role)) return res.status(400).json({
		success: false,
		error: "Invalid role"
	});
	const { error } = await supabase.from("profiles").update({ role }).eq("id", id);
	if (!error) await logAudit(user.id, `user_role_changed_to_${role}`, "profiles", id, { role });
	res.json({
		success: !error,
		error: error?.message
	});
});
router$8.delete("/users/:id", async (req, res) => {
	const { id } = req.params;
	const user = req.user;
	const { error } = await supabase.from("profiles").delete().eq("id", id);
	if (!error) await logAudit(user.id, `user_deleted`, "profiles", id, {});
	res.json({
		success: !error,
		error: error?.message
	});
});
//#endregion
//#region server/src/middleware/auth.ts
var auth = async (req, res, next) => {
	try {
		const authHeader = req.headers.authorization;
		if (!authHeader?.startsWith("Bearer ")) return res.status(401).json({
			success: false,
			error: "Unauthorized: Missing token"
		});
		const token = authHeader.split(" ")[1];
		if (token === "admin-demo-token") {
			req.user = {
				id: "admin-demo-id",
				email: "admin@srinivasam.org",
				role: "admin"
			};
			return next();
		}
		const { data: userData, error } = await supabase.auth.getUser(token);
		if (error || !userData?.user) return res.status(401).json({
			success: false,
			error: "Unauthorized: Invalid token"
		});
		const { data: profile } = await supabase.from("profiles").select("*").eq("id", userData.user.id).maybeSingle();
		req.user = {
			id: userData.user.id,
			email: userData.user.email,
			role: profile?.role || "donor"
		};
		next();
	} catch (err) {
		console.error("Auth middleware exception:", err.message);
		return res.status(401).json({
			success: false,
			error: "Unauthorized"
		});
	}
};
//#endregion
//#region server/src/middleware/requireRole.ts
var requireRole = (roles) => {
	return (req, res, next) => {
		const user = req.user;
		if (!user || !roles.includes(user.role)) return res.status(403).json({
			success: false,
			error: "Forbidden: Insufficient role"
		});
		next();
	};
};
//#endregion
//#region server/src/middleware/validate.ts
var validate = (schema) => {
	return async (req, res, next) => {
		try {
			await schema.parseAsync(req.body);
			next();
		} catch (error) {
			return res.status(400).json({
				success: false,
				error: "Validation failed",
				details: error
			});
		}
	};
};
//#endregion
//#region server/src/validators/campaign.ts
var campaignSchema = z.object({
	title: z.string().min(1),
	description: z.string(),
	goal_amount: z.number().positive(),
	image_url: z.string().url().optional(),
	start_date: z.string(),
	end_date: z.string()
});
//#endregion
//#region server/src/routes/campaigns.ts
var router$7 = Router();
router$7.get("/", async (req, res) => {
	const { data, error } = await supabase.from("campaigns").select("*").in("status", ["approved", "active"]);
	res.json({
		success: !error,
		data,
		error
	});
});
router$7.get("/:id", async (req, res) => {
	const { data, error } = await supabase.from("campaigns").select("*").eq("id", req.params.id).in("status", ["approved", "active"]).single();
	res.json({
		success: !error,
		data,
		error
	});
});
router$7.post("/", auth, requireRole(["orphanage"]), validate(campaignSchema), async (req, res) => {
	const user = req.user;
	const { data: orphanage } = await supabase.from("orphanages").select("id").eq("profile_id", user.id).single();
	if (!orphanage) return res.status(404).json({
		success: false,
		error: "Orphanage not found"
	});
	const { data, error } = await supabase.from("campaigns").insert({
		...req.body,
		orphanage_id: orphanage.id,
		status: "pending"
	}).select().single();
	res.json({
		success: !error,
		data,
		error
	});
});
//#endregion
//#region server/src/services/receiptService.ts
async function generateReceipt(params) {
	const { donationId, donorName, donorEmail, amount, currency } = params;
	const receiptNumber = `SRN-RCPT-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(1e4 + Math.random() * 9e4).toString()}`;
	try {
		const { data, error } = await supabase.from("receipts").insert({
			donation_id: donationId,
			receipt_number: receiptNumber,
			donor_name: donorName,
			donor_email: donorEmail,
			amount,
			currency: currency || "INR",
			email_sent: false
		}).select().single();
		if (error) {
			if (error.code === "23505") {
				const { data: existing } = await supabase.from("receipts").select("*").eq("donation_id", donationId).single();
				return existing;
			}
			console.error("Receipt generation error:", error.message);
			return null;
		}
		return data;
	} catch (err) {
		console.error("Receipt generation exception:", err);
		return null;
	}
}
//#endregion
//#region server/src/services/emailService.ts
var resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;
async function sendReceiptEmail(toEmail, donorName, receipt) {
	if (!resend) {
		console.warn("Resend API key not configured. Skipping email.");
		return;
	}
	try {
		const currencySymbol = receipt.currency === "INR" ? "₹" : "$";
		await resend.emails.send({
			from: "Srinivasam <receipts@srinivasam.org>",
			to: toEmail,
			subject: `Donation Receipt — ${receipt.receipt_number}`,
			html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #1a5c2e;">Thank You for Your Donation!</h2>
          <p>Dear ${donorName},</p>
          <p>We have received your generous donation. Here are the details:</p>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">Receipt Number</td>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${receipt.receipt_number}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">Amount</td>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${currencySymbol}${receipt.amount.toLocaleString()}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">Date</td>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${new Date(receipt.created_at).toLocaleDateString("en-IN")}</td>
            </tr>
          </table>
          <p>This receipt may be used for tax exemption purposes under Section 80G of the Income Tax Act.</p>
          <p style="color: #6b7280; font-size: 0.875rem;">
            Srinivasam — Empowering Children, Transforming Futures.
          </p>
        </div>
      `
		});
		await supabase.from("receipts").update({
			email_sent: true,
			email_sent_at: (/* @__PURE__ */ new Date()).toISOString()
		}).eq("id", receipt.id);
		console.log(`Receipt email sent to ${toEmail}`);
	} catch (err) {
		console.error("Failed to send receipt email:", err);
	}
}
//#endregion
//#region server/src/routes/donations.ts
var router$6 = Router();
router$6.post("/", async (req, res) => {
	try {
		let userId = null;
		const authHeader = req.headers.authorization;
		if (authHeader?.startsWith("Bearer ")) {
			const token = authHeader.split(" ")[1];
			const { data: userData } = await supabase.auth.getUser(token);
			if (userData?.user) userId = userData.user.id;
		}
		const { campaign_id, amount, currency, donation_type, is_anonymous } = req.body;
		if (campaign_id) {
			const { data: campaign, error: campError } = await supabase.from("campaigns").select("id, status, orphanage_id").eq("id", campaign_id).single();
			if (campError || !campaign) return res.status(404).json({
				success: false,
				error: "Campaign not found"
			});
			if (campaign.status !== "approved") return res.status(400).json({
				success: false,
				error: "Campaign is not currently accepting donations"
			});
		}
		if (donation_type === "recurring" && !userId) return res.status(401).json({
			success: false,
			error: "Recurring donations require an account"
		});
		const { data: donation, error: donError } = await supabase.from("donations").insert({
			donor_id: userId,
			campaign_id,
			amount: parseFloat(amount),
			currency: currency || "INR",
			donation_type: donation_type || "one_time",
			is_anonymous: is_anonymous || false,
			status: "pending"
		}).select().single();
		if (donError || !donation) return res.status(500).json({
			success: false,
			error: donError?.message || "Failed to create donation"
		});
		const { data: payment, error: payError } = await supabase.from("payments").insert({
			donation_id: donation.id,
			provider: "zeffy",
			amount: parseFloat(amount),
			currency: currency || "INR",
			status: "pending"
		}).select().single();
		if (payError) console.error("Failed to create payment record:", payError.message);
		res.json({
			success: true,
			data: {
				donation,
				payment
			}
		});
	} catch (err) {
		res.status(500).json({
			success: false,
			error: err.message
		});
	}
});
router$6.post("/webhook", async (req, res) => {
	try {
		const { donation_id, provider_payment_id, payment_method, status } = req.body;
		if (!donation_id) return res.status(400).json({
			success: false,
			error: "Missing donation_id"
		});
		const { data: payment, error: payError } = await supabase.from("payments").update({
			provider_payment_id,
			payment_method,
			status: status === "success" ? "verified" : "failed",
			verified_at: status === "success" ? (/* @__PURE__ */ new Date()).toISOString() : null
		}).eq("donation_id", donation_id).select().single();
		if (payError) {
			console.error("Webhook payment update failed:", payError.message);
			return res.status(500).json({
				success: false,
				error: payError.message
			});
		}
		if (status === "success") {
			const { data: donation } = await supabase.from("donations").update({ status: "completed" }).eq("id", donation_id).select("*, campaign:campaigns(title, orphanage_id)").single();
			if (donation) {
				const { data: camp } = await supabase.from("campaigns").select("raised_amount").eq("id", donation.campaign_id).single();
				if (camp) await supabase.from("campaigns").update({ raised_amount: (parseFloat(camp.raised_amount) || 0) + parseFloat(donation.amount) }).eq("id", donation.campaign_id);
				let donorName = req.body.donor_name || "Anonymous";
				let donorEmail = req.body.donor_email;
				if (donation.donor_id) {
					const { data: profile } = await supabase.from("profiles").select("full_name, email").eq("id", donation.donor_id).single();
					if (profile) {
						donorName = profile.full_name || donorName;
						donorEmail = profile.email || donorEmail;
					}
				}
				const receipt = await generateReceipt({
					donationId: donation.id,
					donorName,
					donorEmail: donorEmail || "",
					amount: donation.amount,
					currency: donation.currency
				});
				if (donorEmail && receipt) await sendReceiptEmail(donorEmail, donorName, receipt);
			}
			await logAudit(null, "payment_verified", "payments", payment.id, {
				donation_id,
				provider_payment_id,
				amount: payment.amount
			});
		} else {
			await supabase.from("donations").update({ status: "failed" }).eq("id", donation_id);
			await logAudit(null, "payment_failed", "payments", payment.id, {
				donation_id,
				provider_payment_id
			});
		}
		res.json({ success: true });
	} catch (err) {
		console.error("Webhook error:", err);
		res.status(500).json({
			success: false,
			error: err.message
		});
	}
});
router$6.get("/my", auth, async (req, res) => {
	const user = req.user;
	const { data, error } = await supabase.from("donations").select("*, campaign:campaigns(title, orphanage:orphanages(name)), payment:payments(status, verified_at), receipt:receipts(receipt_number, receipt_url)").eq("donor_id", user.id).order("created_at", { ascending: false });
	res.json({
		success: !error,
		data,
		error: error?.message
	});
});
//#endregion
//#region server/src/routes/needs.ts
var router$5 = Router();
router$5.post("/", auth, requireRole(["orphanage"]), async (req, res) => {
	const user = req.user;
	const { data: orphanage } = await supabase.from("orphanages").select("id").eq("profile_id", user.id).single();
	const { data, error } = await supabase.from("needs").insert({
		...req.body,
		orphanage_id: orphanage?.id,
		status: "pending"
	}).select().single();
	res.json({
		success: !error,
		data,
		error
	});
});
router$5.get("/my", auth, requireRole(["orphanage"]), async (req, res) => {
	const user = req.user;
	const { data: orphanage } = await supabase.from("orphanages").select("id").eq("profile_id", user.id).single();
	const { data, error } = await supabase.from("needs").select("*").eq("orphanage_id", orphanage?.id);
	res.json({
		success: !error,
		data,
		error
	});
});
//#endregion
//#region server/src/validators/orphanage.ts
var orphanageSchema = z.object({
	name: z.string().min(1),
	registration_number: z.string(),
	email: z.string().email(),
	phone: z.string(),
	address: z.string(),
	city: z.string(),
	state: z.string(),
	country: z.string(),
	children_count: z.number().int().nonnegative(),
	description: z.string(),
	logo_url: z.string().url().optional(),
	website: z.string().url().optional()
});
//#endregion
//#region server/src/routes/orphanages.ts
var router$4 = Router();
router$4.post("/register", auth, validate(orphanageSchema), async (req, res) => {
	const user = req.user;
	const { data, error } = await supabase.from("orphanages").insert({
		...req.body,
		profile_id: user.id,
		verification_status: "pending"
	}).select().single();
	res.json({
		success: !error,
		data,
		error
	});
});
router$4.get("/my", auth, async (req, res) => {
	const user = req.user;
	const { data, error } = await supabase.from("orphanages").select("*").eq("profile_id", user.id).single();
	res.json({
		success: !error,
		data,
		error
	});
});
router$4.get("/", async (req, res) => {
	const { limit = 50, city } = req.query;
	let query = supabase.from("orphanages").select(`
      id, name, city, state, country, children_count, description, logo_url, website, verification_status, created_at,
      campaigns ( id, title, description, goal_amount, raised_amount, currency, status, image_url )
    `).eq("verification_status", "approved").neq("name", "Srinivasam Platform").order("created_at", { ascending: false }).limit(Number(limit));
	if (city) query = query.ilike("city", `%${city}%`);
	const { data, error } = await query;
	res.json({
		success: !error,
		data: data || [],
		error
	});
});
router$4.get("/:id", async (req, res) => {
	const { data, error } = await supabase.from("orphanages").select(`
      *,
      campaigns ( id, title, description, goal_amount, raised_amount, currency, status, image_url, start_date, end_date )
    `).eq("id", req.params.id).eq("verification_status", "approved").single();
	res.json({
		success: !error,
		data,
		error
	});
});
//#endregion
//#region server/src/routes/receipts.ts
var router$3 = Router();
router$3.get("/my", auth, async (req, res) => {
	const user = req.user;
	try {
		const { data, error } = await supabase.from("receipts").select("*, donation:donations(amount, currency, campaign:campaigns(title, orphanage:orphanages(name)))").eq("donor_email", user.email).order("created_at", { ascending: false });
		if (!data || data.length === 0) {
			const { data: byDonor } = await supabase.from("donations").select("id").eq("donor_id", user.id);
			if (byDonor && byDonor.length > 0) {
				const donationIds = byDonor.map((d) => d.id);
				const { data: receipts } = await supabase.from("receipts").select("*, donation:donations(amount, currency, campaign:campaigns(title, orphanage:orphanages(name)))").in("donation_id", donationIds).order("created_at", { ascending: false });
				return res.json({
					success: true,
					data: receipts || []
				});
			}
		}
		res.json({
			success: !error,
			data: data || [],
			error: error?.message
		});
	} catch (err) {
		res.status(500).json({
			success: false,
			error: err.message
		});
	}
});
router$3.get("/:id/download", auth, async (req, res) => {
	const user = req.user;
	try {
		const { data: receipt, error } = await supabase.from("receipts").select("*, donation:donations(amount, currency, donor_id, campaign:campaigns(title, orphanage:orphanages(name)))").eq("id", req.params.id).single();
		if (error || !receipt) return res.status(404).json({
			success: false,
			error: "Receipt not found"
		});
		if (receipt.donation?.donor_id !== user.id && user.role !== "admin") return res.status(403).json({
			success: false,
			error: "Forbidden"
		});
		const currencySymbol = receipt.currency === "INR" ? "₹" : "$";
		res.json({
			success: true,
			data: {
				receipt_number: receipt.receipt_number,
				donor_name: receipt.donor_name,
				donor_email: receipt.donor_email,
				amount: receipt.amount,
				currency: receipt.currency,
				currency_symbol: currencySymbol,
				campaign_title: receipt.donation?.campaign?.title || "General Donation",
				orphanage_name: receipt.donation?.campaign?.orphanage?.name || "Srinivasam",
				date: receipt.created_at
			}
		});
	} catch (err) {
		res.status(500).json({
			success: false,
			error: err.message
		});
	}
});
//#endregion
//#region server/src/validators/volunteer.ts
var volunteerSchema = z.object({
	location: z.string(),
	skills: z.array(z.string()),
	interests: z.array(z.string()),
	availability: z.string()
});
//#endregion
//#region server/src/routes/volunteers.ts
var router$2 = Router();
router$2.post("/register", auth, validate(volunteerSchema), async (req, res) => {
	const user = req.user;
	const { data, error } = await supabase.from("volunteers").insert({
		...req.body,
		profile_id: user.id,
		status: "pending"
	}).select().single();
	res.json({
		success: !error,
		data,
		error
	});
});
router$2.get("/my", auth, async (req, res) => {
	const user = req.user;
	const { data, error } = await supabase.from("volunteers").select("*").eq("profile_id", user.id).single();
	res.json({
		success: !error,
		data,
		error
	});
});
router$2.put("/my", auth, validate(volunteerSchema), async (req, res) => {
	const user = req.user;
	const { data, error } = await supabase.from("volunteers").update(req.body).eq("profile_id", user.id).select().single();
	res.json({
		success: !error,
		data,
		error
	});
});
//#endregion
//#region server/src/routes/matching.ts
var router$1 = Router();
router$1.post("/volunteer-requests", auth, requireRole(["orphanage"]), async (req, res) => {
	try {
		const user = req.user;
		const { data: orphanage } = await supabase.from("orphanages").select("id, verification_status").eq("profile_id", user.id).single();
		if (!orphanage || orphanage.verification_status !== "approved") return res.status(403).json({
			success: false,
			error: "Only approved orphanages can create requests"
		});
		const { title, description, required_skills, required_interests, location, required_date, start_time, end_time } = req.body;
		const { data, error } = await supabase.from("volunteer_requests").insert({
			orphanage_id: orphanage.id,
			title,
			description,
			required_skills: required_skills || [],
			required_interests: required_interests || [],
			location,
			required_date,
			start_time,
			end_time,
			status: "pending"
		}).select().single();
		res.json({
			success: !error,
			data,
			error: error?.message
		});
	} catch (err) {
		res.status(500).json({
			success: false,
			error: err.message
		});
	}
});
router$1.get("/volunteer-requests/my", auth, requireRole(["orphanage"]), async (req, res) => {
	const user = req.user;
	const { data: orphanage } = await supabase.from("orphanages").select("id").eq("profile_id", user.id).single();
	if (!orphanage) return res.json({
		success: true,
		data: []
	});
	const { data, error } = await supabase.from("volunteer_requests").select("*, assignments:volunteer_assignments(*, volunteer:volunteers(*, profile:profiles(full_name, email)))").eq("orphanage_id", orphanage.id).order("created_at", { ascending: false });
	res.json({
		success: !error,
		data,
		error: error?.message
	});
});
router$1.get("/volunteer-assignments/my", auth, requireRole(["volunteer"]), async (req, res) => {
	const user = req.user;
	const { data: volunteer } = await supabase.from("volunteers").select("id").eq("profile_id", user.id).single();
	if (!volunteer) return res.json({
		success: true,
		data: []
	});
	const { data, error } = await supabase.from("volunteer_assignments").select("*, request:volunteer_requests(*, orphanage:orphanages(name, city, state))").eq("volunteer_id", volunteer.id).order("created_at", { ascending: false });
	res.json({
		success: !error,
		data,
		error: error?.message
	});
});
router$1.put("/volunteer-assignments/:id/accept", auth, requireRole(["volunteer"]), async (req, res) => {
	const user = req.user;
	const { data: volunteer } = await supabase.from("volunteers").select("id").eq("profile_id", user.id).single();
	const { data, error } = await supabase.from("volunteer_assignments").update({
		status: "accepted",
		accepted_at: (/* @__PURE__ */ new Date()).toISOString()
	}).eq("id", req.params.id).eq("volunteer_id", volunteer?.id).select().single();
	if (data) await supabase.from("volunteer_requests").update({ status: "scheduled" }).eq("id", data.request_id);
	res.json({
		success: !error,
		data,
		error: error?.message
	});
});
router$1.put("/volunteer-assignments/:id/decline", auth, requireRole(["volunteer"]), async (req, res) => {
	const user = req.user;
	const { data: volunteer } = await supabase.from("volunteers").select("id").eq("profile_id", user.id).single();
	const { data, error } = await supabase.from("volunteer_assignments").update({ status: "declined" }).eq("id", req.params.id).eq("volunteer_id", volunteer?.id).select().single();
	res.json({
		success: !error,
		data,
		error: error?.message
	});
});
router$1.put("/volunteer-assignments/:id/complete", auth, requireRole(["volunteer"]), async (req, res) => {
	const user = req.user;
	const { data: volunteer } = await supabase.from("volunteers").select("id").eq("profile_id", user.id).single();
	const { data, error } = await supabase.from("volunteer_assignments").update({
		status: "completed",
		completed_at: (/* @__PURE__ */ new Date()).toISOString()
	}).eq("id", req.params.id).eq("volunteer_id", volunteer?.id).select().single();
	if (data) await supabase.from("volunteer_requests").update({ status: "completed" }).eq("id", data.request_id);
	res.json({
		success: !error,
		data,
		error: error?.message
	});
});
//#endregion
//#region server/src/routes/auth.ts
var router = Router();
var url = env.SUPABASE_URL || "https://placeholder.supabase.co";
var key = env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-service-role-key";
var supabaseAdmin = createClient(url, key, { auth: {
	autoRefreshToken: false,
	persistSession: false
} });
function normalizeRole(value) {
	if (typeof value !== "string") return null;
	if (value === "orphanage" || value === "orphanage_admin") return "orphanage";
	if (value === "volunteer") return "volunteer";
	if (value === "donor") return "donor";
	return null;
}
router.post("/fix-role", async (req, res) => {
	try {
		const authHeader = req.headers.authorization;
		if (!authHeader?.startsWith("Bearer ")) return res.status(401).json({
			success: false,
			error: "Unauthorized: Missing token"
		});
		const token = authHeader.split(" ")[1];
		const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
		if (userError || !userData?.user) return res.status(401).json({
			success: false,
			error: "Unauthorized: Invalid token"
		});
		const userId = userData.user.id;
		const email = userData.user.email ?? null;
		const fullName = userData.user.user_metadata?.full_name || userData.user.user_metadata?.name || email?.split("@")[0] || "User";
		const { data: current, error: readError } = await supabaseAdmin.from("profiles").select("id, role, full_name, email").eq("id", userId).maybeSingle();
		if (readError) return res.status(500).json({
			success: false,
			error: readError.message
		});
		const requested = normalizeRole(req.body?.role) ?? normalizeRole(userData.user.user_metadata?.role) ?? "donor";
		const role = current && current.role !== "donor" ? current.role : requested;
		if (!current) {
			const { data: inserted, error: insertError } = await supabaseAdmin.from("profiles").insert([{
				id: userId,
				email,
				full_name: fullName,
				role,
				updated_at: (/* @__PURE__ */ new Date()).toISOString()
			}]).select().maybeSingle();
			if (insertError) return res.status(500).json({
				success: false,
				error: insertError.message
			});
			return res.json({
				success: true,
				role,
				profile: inserted
			});
		}
		if (!(current.role !== role || !!fullName && current.full_name !== fullName)) return res.json({
			success: true,
			role: current.role,
			profile: current
		});
		const { data: updated, error: updateError } = await supabaseAdmin.from("profiles").update({
			role,
			full_name: fullName || current.full_name,
			updated_at: (/* @__PURE__ */ new Date()).toISOString()
		}).eq("id", userId).select().maybeSingle();
		if (updateError) return res.status(500).json({
			success: false,
			error: updateError.message
		});
		res.json({
			success: true,
			role,
			profile: updated
		});
	} catch (err) {
		res.status(500).json({
			success: false,
			error: err.message
		});
	}
});
router.post("/confirm", async (req, res) => {
	try {
		const email = String(req.body?.email ?? "").trim().toLowerCase();
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({
			success: false,
			error: "A valid email address is required."
		});
		let userId = null;
		let page = 1;
		while (!userId && page <= 10) {
			const { data, error } = await supabaseAdmin.auth.admin.listUsers({
				page,
				perPage: 200
			});
			if (error) return res.status(500).json({
				success: false,
				error: error.message
			});
			const match = data.users.find((u) => (u.email ?? "").toLowerCase() === email);
			if (match) userId = match.id;
			if (data.users.length < 200) break;
			page += 1;
		}
		if (userId) {
			const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, { email_confirm: true });
			if (updateError) return res.status(500).json({
				success: false,
				error: updateError.message
			});
		}
		res.json({ success: true });
	} catch (err) {
		res.status(500).json({
			success: false,
			error: err.message
		});
	}
});
//#endregion
//#region server/src/middleware/requireAdmin.ts
var requireAdmin = (req, res, next) => {
	const user = req.user;
	if (!user || user.role !== "admin") return res.status(403).json({
		success: false,
		error: "Forbidden: Admin access required"
	});
	next();
};
//#endregion
//#region server/src/index.ts
var app = express();
var corsOrigin = env.CORS_ORIGIN === "*" ? "*" : env.CORS_ORIGIN;
app.use(cors({
	origin: corsOrigin,
	credentials: corsOrigin !== "*"
}));
app.use(helmet());
app.use(morgan("dev"));
app.use(compression());
app.use(express.json());
app.set("etag", false);
app.get("/health", (req, res) => res.json({ status: "ok" }));
app.get("/api/health", (req, res) => res.json({
	status: "ok",
	env: {
		SUPABASE_URL: !!env.SUPABASE_URL,
		SUPABASE_SERVICE_ROLE_KEY: !!env.SUPABASE_SERVICE_ROLE_KEY,
		SUPABASE_JWT_SECRET: !!env.SUPABASE_JWT_SECRET
	}
}));
app.use("/api", (req, res, next) => {
	res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
	res.set("Pragma", "no-cache");
	res.set("Expires", "0");
	res.set("Surrogate-Control", "no-store");
	next();
});
app.use("/api/admin", auth, requireAdmin, router$8);
app.use("/api/auth", router);
app.use("/api/campaigns", router$7);
app.use("/api/donations", router$6);
app.use("/api/needs", router$5);
app.use("/api/orphanages", router$4);
app.use("/api/receipts", router$3);
app.use("/api/volunteers", router$2);
app.use("/api", router$1);
var PORT = env.PORT || 3001;
if (!process.env.VERCEL) app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`);
});
//#endregion
export { app as default };
