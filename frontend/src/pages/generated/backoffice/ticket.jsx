// Native React page. Data contract: backoffice/ticket.
import {
  Fragment,
  cssStyle,
  text,
  FieldGroup,
  Field,
  TextArea,
  SelectField,
  ActionForm,
  CsrfField,
  FaultHintsProvider,
} from "@ui/runtime";
export default function Page({ data, state }) {
  return (
    <>
      <FaultHintsProvider hints={data.faultHints || {}}>
        {"\n"}
        <div className={"page-head"}>
          <div>
            <a className={"small"} href={"/app/help/tickets/"}>
              {"‹ Tickets"}
            </a>
            {"\n  "}
            <div className={"row"} style={cssStyle("margin-top:.3rem")}>
              <h1>{data.v1}</h1>
              <span className={"badge " + text(data.v2)}>{data.v3}</span>
              {data.choice4 === 0 ? (
                <>
                  <span className={"badge b-red"}>
                    {"reopened ×"}
                    {data.v5}
                  </span>
                </>
              ) : null}
              {data.choice6 === 0 ? (
                <>
                  <span className={"badge b-green"}>
                    {"⭐ "}
                    {data.v7}
                    {"/5 stars"}
                  </span>
                </>
              ) : null}
            </div>
            {"\n  "}
            <div className={"sub"}>
              <a href={"/app/help/customer/" + text(data.v8) + "/"}>
                {data.v9}
              </a>
              {" · "}
              {data.v10}
              {" · opened "}
              {data.v11}
              {" via "}
              {data.v12}
            </div>
          </div>
        </div>
        {"\n\n"}
        {data.choice13 === 0 ? (
          <>
            <div className={"banner ok mb"}>
              <span className={"ico"}>{"✓"}</span>
              <div>
                <div className={"big"}>
                  {
                    "IN WARRANTY: repair or replacement costs the customer nothing"
                  }
                </div>
                <div className={"small"}>{data.v14}</div>
              </div>
            </div>
            {"\n"}
          </>
        ) : data.choice13 === 1 ? (
          <>
            <div className={"banner bad mb"}>
              <span className={"ico"}>{"✕"}</span>
              <div>
                <div className={"big"}>
                  {"NOT COVERED: parts and labour will be billed automatically"}
                </div>
                <div className={"small"}>{data.v15}</div>
              </div>
            </div>
            {"\n"}
          </>
        ) : data.choice13 === 2 ? (
          <>
            <div className={"banner info mb"}>
              <span className={"ico"}>{"?"}</span>
              <div className={"small"}>{data.v16}</div>
            </div>
          </>
        ) : null}
        {"\n\n"}
        <div className={"grid g-main"}>
          {"\n  "}
          <div className={"stack"}>
            {"\n    "}
            <div className={"card"}>
              <div className={"card-h"}>
                <h2>{"Problem"}</h2>
              </div>
              <div className={"card-b"}>
                <dl className={"kv"}>
                  {"\n      "}
                  <dt>{"Unit"}</dt>
                  <dd>
                    {data.choice17 === 0 ? (
                      <>
                        {data.v18}{" "}
                        <a
                          className={"mono small"}
                          href={
                            "/app/inventory/serials/" + text(data.v19) + "/"
                          }
                        >
                          {data.v20}
                        </a>
                      </>
                    ) : data.choice17 === 1 ? (
                      <>{"Not selected"}</>
                    ) : null}
                  </dd>
                  {"\n      "}
                  {data.choice21 === 0 ? (
                    <>
                      <dt>{"Warranty"}</dt>
                      <dd>
                        <span className={"badge " + text(data.v22)}>
                          {data.v23}
                        </span>
                        {data.choice24 === 0 ? (
                          <>
                            {" until "}
                            {data.v25}
                          </>
                        ) : null}
                      </dd>
                    </>
                  ) : null}
                  {"\n      "}
                  <dt>{"Fault code"}</dt>
                  <dd>
                    {data.v26}
                    {data.choice27 === 0 ? (
                      <>
                        <div
                          className={"small mt-s"}
                          style={cssStyle(
                            "color:var(--brand-ink);background:var(--brand-soft);padding:.35rem .65rem;border-radius:6px;border-left:3px solid var(--brand);margin-top:4px",
                          )}
                        >
                          {"💡 "}
                          <b>{"Diagnostic hint:"}</b> {data.v28}
                        </div>
                      </>
                    ) : null}
                  </dd>
                  <dt>{"Description"}</dt>
                  <dd>{data.v29}</dd>
                  {"\n      "}
                  <dt>{"Technician"}</dt>
                  <dd>
                    {data.v30}
                    {data.choice31 === 0 ? (
                      <>
                        {" · visit "}
                        {data.v32}
                      </>
                    ) : null}
                  </dd>
                  {"\n      "}
                  {data.choice33 === 0 ? (
                    <>
                      <dt>{"Project"}</dt>
                      <dd>
                        <a href={"/app/p/" + text(data.v34) + "/"}>
                          {data.v35}
                        </a>
                        {" · "}
                        {data.v36}
                      </dd>
                    </>
                  ) : null}
                </dl>
              </div>
            </div>
            {"\n\n    "}
            {data.choice37 === 0 ? (
              <>
                {"\n    "}
                <div className={"card"}>
                  <div className={"card-h"}>
                    <h2>{"Record the work"}</h2>
                  </div>
                  <div className={"card-b"}>
                    {"\n      "}
                    <ActionForm
                      method={"post"}
                      action={"/app/help/tickets/" + text(data.v38) + "/do/"}
                      className={"stack"}
                    >
                      <CsrfField />
                      <Field
                        type={"hidden"}
                        name={"action"}
                        value={"resolve"}
                      />
                      {"\n        "}
                      <div className={"fields"}>
                        {"\n          "}
                        <FieldGroup className={"field full"}>
                          <label>{"What was done?"}</label>
                          <TextArea
                            className={"inp"}
                            name={"notes"}
                            rows={"3"}
                            placeholder={
                              "For example: replaced the inverter, ran a generation test"
                            }
                          ></TextArea>
                        </FieldGroup>
                        {"\n          "}
                        <FieldGroup className={"field"}>
                          <label>{"Hours spent"}</label>
                          <Field
                            className={"inp"}
                            name={"hours"}
                            inputMode={"decimal"}
                            placeholder={"2"}
                            required={true}
                          />
                        </FieldGroup>
                        {"\n          "}
                        {data.choice39 === 0 ? (
                          <>
                            <FieldGroup className={"field"}>
                              <label>{"Faulty unit serial"}</label>
                              <Field
                                className={"inp mono"}
                                name={"fault_serial"}
                                placeholder={"Scan or type"}
                              />
                            </FieldGroup>
                          </>
                        ) : null}
                        {"\n          "}
                        <FieldGroup className={"field full"}>
                          <label>
                            {"Replacement unit serial "}
                            <span className={"faint"}>
                              {"(only if the unit was swapped)"}
                            </span>
                          </label>
                          <Field
                            className={"inp mono"}
                            name={"replacement"}
                            placeholder={"Scan the new unit"}
                            list={"spares"}
                          />
                          <datalist id={"spares"}>
                            {data.rows40?.length ? (
                              data.rows40.map((row40, index) => (
                                <Fragment key={index}>
                                  <option value={text(row40.v41)}></option>
                                </Fragment>
                              ))
                            ) : (
                              <></>
                            )}
                          </datalist>
                          {"\n            "}
                          <span className={"hint"}>
                            {data.choice42 === 0 ? (
                              <>
                                {
                                  "A replacement inherits the remaining warranty of the unit it replaces."
                                }
                              </>
                            ) : data.choice42 === 1 ? (
                              <>
                                {"A paid replacement starts a fresh warranty."}
                              </>
                            ) : null}
                          </span>
                        </FieldGroup>
                        {"\n          "}
                        <FieldGroup className={"field"}>
                          <label>{"Other part used"}</label>
                          <SelectField className={"inp"} name={"part"}>
                            <option value={""}>{"None"}</option>
                            {data.rows43?.length ? (
                              data.rows43.map((row43, index) => (
                                <Fragment key={index}>
                                  <option value={text(row43.v44)}>
                                    {row43.v45}
                                  </option>
                                </Fragment>
                              ))
                            ) : (
                              <></>
                            )}
                          </SelectField>
                        </FieldGroup>
                        {"\n          "}
                        <FieldGroup className={"field"}>
                          <label>{"Part quantity"}</label>
                          <Field
                            className={"inp"}
                            name={"part_qty"}
                            inputMode={"decimal"}
                          />
                        </FieldGroup>
                        {"\n        "}
                      </div>
                      {"\n        "}
                      <button className={"btn btn-primary"}>
                        {data.choice46 === 0 ? (
                          <>{"Resolve (no charge)"}</>
                        ) : data.choice46 === 1 ? (
                          <>{"Resolve and create the invoice"}</>
                        ) : null}
                      </button>
                      {"\n      "}
                    </ActionForm>
                  </div>
                </div>
                {"\n    "}
              </>
            ) : null}
            {"\n\n    "}
            {data.choice47 === 0 ? (
              <>
                {"\n    "}
                <div className={"card"}>
                  <div className={"card-h"}>
                    <h2>{"Waiting for the customer"}</h2>
                  </div>
                  <div className={"card-b stack"}>
                    {"\n      "}
                    <div className={"gate"}>
                      {
                        "The customer has been asked to confirm that everything works. The ticket cannot be closed until they do."
                      }
                    </div>
                    {"\n      "}
                    <ActionForm
                      method={"post"}
                      action={"/app/help/tickets/" + text(data.v48) + "/do/"}
                      className={"row"}
                    >
                      <CsrfField />
                      <Field
                        type={"hidden"}
                        name={"action"}
                        value={"confirm"}
                      />
                      {"\n        "}
                      <span className={"small muted grow"}>
                        {
                          "On site with the customer? Capture their answer on this device:"
                        }
                      </span>
                      <SelectField
                        className={"inp inp-sm"}
                        name={"rating"}
                        style={cssStyle(
                          "width:auto;display:inline-block;padding:.2rem .4rem",
                        )}
                      >
                        <option value={"5"} selected={true}>
                          {"⭐ 5"}
                        </option>
                        <option value={"4"}>{"⭐ 4"}</option>
                        <option value={"3"}>{"⭐ 3"}</option>
                        <option value={"2"}>{"⭐ 2"}</option>
                        <option value={"1"}>{"⭐ 1"}</option>
                      </SelectField>
                      <button
                        className={"btn btn-ok btn-sm"}
                        name={"works"}
                        value={"1"}
                      >
                        {"Customer says it works"}
                      </button>
                      <button
                        className={"btn btn-danger btn-sm"}
                        name={"works"}
                        value={"0"}
                      >
                        {"Still not working"}
                      </button>
                    </ActionForm>
                    {"\n      "}
                    <details>
                      <summary
                        className={"small muted"}
                        style={cssStyle("cursor:pointer")}
                      >
                        {"Close without the customer"}
                      </summary>
                      {"\n        "}
                      <ActionForm
                        method={"post"}
                        action={"/app/help/tickets/" + text(data.v49) + "/do/"}
                        className={"stack mt-s"}
                      >
                        <CsrfField />
                        <Field
                          type={"hidden"}
                          name={"action"}
                          value={"close"}
                        />
                        {"\n          "}
                        <Field
                          className={"inp"}
                          name={"reason"}
                          placeholder={"Reason (Director only)"}
                        />
                        <button
                          className={
                            "btn btn-line btn-sm " +
                            (data.choice50 === 0 ? "is-disabled" : "")
                          }
                          {...(data.attr51 === 0
                            ? {
                                title:
                                  "Waiting for the customer's confirmation.",
                                "aria-disabled": "true",
                              }
                            : {})}
                        >
                          {"Close ticket"}
                        </button>
                      </ActionForm>
                    </details>
                    {"\n    "}
                  </div>
                </div>
              </>
            ) : null}
            {"\n  "}
          </div>
          {"\n  "}
          <div className={"stack"}>
            {"\n    "}
            {data.choice52 === 0 ? (
              <>
                <div className={"card"}>
                  <div className={"card-h"}>
                    <h2>{"Work and parts"}</h2>
                  </div>
                  <div className={"card-b tight tbl-wrap"}>
                    <table className={"table"}>
                      <tbody>
                        {data.rows53?.length ? (
                          data.rows53.map((row53, index) => (
                            <Fragment key={index}>
                              <tr>
                                <td>{row53.v54}</td>
                                <td className={"num"}>{row53.v55}</td>
                                <td className={"num"}>
                                  {row53.choice56 === 0 ? (
                                    <>{row53.v57}</>
                                  ) : row53.choice56 === 1 ? (
                                    <>
                                      <span className={"badge b-green"}>
                                        {"no charge"}
                                      </span>
                                    </>
                                  ) : null}
                                </td>
                              </tr>
                            </Fragment>
                          ))
                        ) : (
                          <></>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : null}
            {"\n    "}
            {data.choice58 === 0 ? (
              <>
                <div className={"card"}>
                  <div className={"card-h"}>
                    <h2>{"Service invoice"}</h2>
                    <span className={"badge " + text(data.v59)}>
                      {data.v60}
                    </span>
                  </div>
                  <div className={"card-b"}>
                    <div
                      className={"bold"}
                      style={cssStyle("font-size:1.3rem")}
                    >
                      {data.v61}
                    </div>
                    <div className={"small muted"}>
                      {data.v62}
                      {" · balance "}
                      {data.v63}
                    </div>
                    <a
                      className={"btn btn-line btn-sm mt-s"}
                      href={"/doc/invoice/" + text(data.v64) + "/"}
                    >
                      {"Open invoice"}
                    </a>
                  </div>
                </div>
              </>
            ) : null}
            {"\n    "}
            {data.choice65 === 0 ? (
              <>
                <div className={"banner ok"}>
                  <span className={"ico"}>{"✓"}</span>
                  <div>
                    {"Closed "}
                    {data.v66}
                    {"."}
                    {data.choice67 === 0 ? (
                      <>
                        {" Director override: "}
                        {data.v68}
                        {"."}
                      </>
                    ) : null}
                  </div>
                </div>
              </>
            ) : null}
            {"\n    "}
            {data.choice69 === 0 ? (
              <>
                <div className={"card"}>
                  <div className={"card-h"}>
                    <h2>{"Warranty exclusion"}</h2>
                  </div>
                  <div className={"card-b"}>
                    <ActionForm
                      method={"post"}
                      action={"/app/help/tickets/" + text(data.v70) + "/do/"}
                      className={"stack"}
                    >
                      <CsrfField />
                      <Field
                        type={"hidden"}
                        name={"action"}
                        value={"exclude"}
                      />
                      <Field
                        className={"inp"}
                        name={"reason"}
                        placeholder={"For example: damaged by lightning"}
                      />
                      <button className={"btn btn-danger btn-sm"}>
                        {"Mark as not covered"}
                      </button>
                    </ActionForm>
                    <p className={"hint mt-s"}>
                      {
                        "Use only when the warranty terms exclude the cause. The customer is then billed."
                      }
                    </p>
                  </div>
                </div>
              </>
            ) : null}
            {"\n    "}
            {data.choice71 === 0 ? (
              <>
                <div className={"card"}>
                  <div className={"card-h"}>
                    <h2>{"Activity"}</h2>
                  </div>
                  <div className={"card-b"}>
                    <ul className={"tl"}>
                      {data.rows72?.length ? (
                        data.rows72.map((row72, index) => (
                          <Fragment key={index}>
                            <li>
                              <span className={"when"}>{row72.v73}</span>
                              <span className={"what small"}>{row72.v74}</span>
                            </li>
                          </Fragment>
                        ))
                      ) : (
                        <></>
                      )}
                    </ul>
                  </div>
                </div>
              </>
            ) : null}
            {"\n  "}
          </div>
          {"\n"}
        </div>
        {"\n"}
      </FaultHintsProvider>
    </>
  );
}
