// Native React page. Data contract: backoffice/tabs/quote.
import {
  Fragment,
  cssStyle,
  text,
  FieldGroup,
  Field,
  SelectField,
  ActionForm,
  CsrfField,
} from "@ui/runtime";
export default function Page({ data, state }) {
  return (
    <>
      {data.choice1 === 0 ? (
        <>
          <div className={"gate mb"}>
            <span>{"🔒"}</span>
            <span>{data.v2}</span>
          </div>
        </>
      ) : null}
      {"\n"}
      {data.choice3 === 0 ? (
        <>
          {"\n"}
          <div className={"card"}>
            <div className={"card-b"}>
              {"\n  "}
              <h3>{"No quote yet"}</h3>
              {"\n  "}
              <p className={"muted"}>
                {"The quote is built from the kit template"}
                {data.choice4 === 0 ? (
                  <>
                    {" "}
                    <b>{data.v5}</b>
                  </>
                ) : null}
                {
                  " and the approved survey: every part follows on its own, so nobody has to remember the small ones."
                }
              </p>
              {"\n  "}
              <ActionForm
                method={"post"}
                action={"/app/p/" + text(data.v6) + "/do/quote_build/"}
                className={"row"}
              >
                <CsrfField />
                {"\n    "}
                <FieldGroup className={"field"} style={cssStyle("width:140px")}>
                  <label>{"Discount %"}</label>
                  <Field
                    className={"inp"}
                    name={"discount"}
                    value={"0"}
                    inputMode={"decimal"}
                  />
                </FieldGroup>
                {"\n    "}
                <button
                  className={
                    "btn btn-primary " +
                    (data.choice7 === 0 ? "is-disabled" : "")
                  }
                  style={cssStyle("align-self:flex-end")}
                  {...(data.attr8 === 0
                    ? { title: text(data.v9), "aria-disabled": "true" }
                    : {})}
                >
                  {"Create quote"}
                </button>
                {"\n  "}
              </ActionForm>
              {"\n"}
            </div>
          </div>
          {"\n"}
        </>
      ) : data.choice3 === 1 ? (
        <>
          {"\n"}
          <div className={"spread mb"}>
            <div className={"row"}>
              <h2>
                {"Quote v"}
                {data.v10}
              </h2>
              <span className={"badge " + text(data.v11)}>{data.v12}</span>
              <span className={"muted small"}>
                {data.v13}
                {" kW · "}
                {data.v14}
                {" panels"}
                {data.choice15 === 0 ? (
                  <>
                    {" · template "}
                    {data.v16}
                  </>
                ) : null}
                {data.choice17 === 0 ? (
                  <>
                    {" · valid until "}
                    {data.v18}
                  </>
                ) : null}
              </span>
            </div>
            {"\n  "}
            <div className={"row"}>
              <a
                className={"btn btn-line btn-sm"}
                href={"/doc/quote/" + text(data.v19) + "/"}
              >
                {"Print"}
              </a>
              {"\n  "}
              {data.choice20 === 0 ? (
                <>
                  <ActionForm
                    method={"post"}
                    action={"/app/p/" + text(data.v21) + "/do/quote_build/"}
                    className={"inline-form"}
                    data-confirm={
                      "Create a revised quote? The sent quote will be superseded."
                    }
                  >
                    <CsrfField />
                    <button className={"btn btn-line btn-sm"}>
                      {"Create revised quote"}
                    </button>
                  </ActionForm>
                </>
              ) : null}
            </div>
          </div>
          {"\n"}
          <div className={"grid g-main"}>
            {"\n  "}
            <div className={"card"}>
              <div className={"card-b tight"}>
                {"\n    "}
                <ActionForm
                  id={"qform"}
                  method={"post"}
                  action={"/app/p/" + text(data.v22) + "/do/quote_update/"}
                >
                  <CsrfField />
                  {"\n    "}
                  <div className={"tbl-wrap"}>
                    <table className={"table"}>
                      <thead>
                        <tr>
                          <th>{"Item"}</th>
                          <th className={"num"}>{"Qty"}</th>
                          <th className={"num"}>{"Rate"}</th>
                          <th className={"num"}>{"Amount"}</th>
                          {data.choice23 === 0 ? (
                            <>
                              <th></th>
                            </>
                          ) : null}
                        </tr>
                      </thead>
                      <tbody>
                        {data.rows24?.length ? (
                          data.rows24.map((row24, index) => (
                            <Fragment key={index}>
                              <tr>
                                <td>
                                  {row24.v25}{" "}
                                  {row24.choice26 === 0 ? (
                                    <>
                                      <span className={"badge b-blue"}>
                                        {"auto"}
                                      </span>
                                    </>
                                  ) : row24.choice26 === 1 ? (
                                    <>
                                      <span className={"badge b-grey"}>
                                        {"edited"}
                                      </span>
                                    </>
                                  ) : null}
                                  <br />
                                  <span className={"tiny faint"}>
                                    {row24.v27}
                                  </span>
                                </td>
                                <td className={"num"}>
                                  {row24.choice28 === 0 ? (
                                    <>
                                      <Field
                                        className={"inp"}
                                        style={cssStyle(
                                          "width:86px;text-align:right",
                                        )}
                                        name={"qty_" + text(row24.v29)}
                                        value={text(row24.v30)}
                                        inputMode={"decimal"}
                                      />
                                    </>
                                  ) : row24.choice28 === 1 ? (
                                    <>{row24.v31}</>
                                  ) : null}
                                </td>
                                <td className={"num"}>{row24.v32}</td>
                                <td className={"num"}>{row24.v33}</td>
                                {row24.choice34 === 0 ? (
                                  <>
                                    <td>
                                      <button
                                        type={"submit"}
                                        form={"rm-" + text(row24.v35)}
                                        className={"btn btn-sm btn-danger"}
                                        title={"Remove this line"}
                                      >
                                        {"✕"}
                                      </button>
                                    </td>
                                  </>
                                ) : null}
                              </tr>
                            </Fragment>
                          ))
                        ) : (
                          <></>
                        )}
                      </tbody>
                    </table>
                  </div>
                  {"\n    "}
                  {data.choice36 === 0 ? (
                    <>
                      <div
                        className={"spread"}
                        style={cssStyle(
                          "padding:.9rem 1.1rem;border-top:1px solid var(--line)",
                        )}
                      >
                        <div className={"row"}>
                          <label className={"small bold"}>{"Discount %"}</label>
                          <Field
                            className={"inp"}
                            style={cssStyle("width:90px")}
                            name={"discount"}
                            value={text(data.v37)}
                            inputMode={"decimal"}
                          />
                          <span className={"hint"}>
                            {"Max "}
                            {data.v38}
                            {"% without the Director"}
                          </span>
                        </div>
                        <button className={"btn btn-dark btn-sm"}>
                          {"Save changes"}
                        </button>
                      </div>
                    </>
                  ) : null}
                  {"\n    "}
                </ActionForm>
                {"\n    "}
                {data.choice39 === 0 ? (
                  <>
                    {data.rows40?.length ? (
                      data.rows40.map((row40, index) => (
                        <Fragment key={index}>
                          <ActionForm
                            id={"rm-" + text(row40.v41)}
                            method={"post"}
                            action={
                              "/app/p/" + text(row40.v42) + "/do/quote_remove/"
                            }
                          >
                            <CsrfField />
                            <Field
                              type={"hidden"}
                              name={"line"}
                              value={text(row40.v43)}
                            />
                          </ActionForm>
                        </Fragment>
                      ))
                    ) : (
                      <></>
                    )}
                    {"\n    "}
                    <ActionForm
                      method={"post"}
                      action={"/app/p/" + text(data.v44) + "/do/quote_add/"}
                      className={"row"}
                      style={cssStyle(
                        "padding:.9rem 1.1rem;border-top:1px solid var(--line)",
                      )}
                    >
                      <CsrfField />
                      {"\n      "}
                      <SelectField
                        className={"inp"}
                        name={"product"}
                        style={cssStyle("max-width:320px")}
                      >
                        <option value={""}>{"Add a part…"}</option>
                        {data.rows45?.length ? (
                          data.rows45.map((row45, index) => (
                            <Fragment key={index}>
                              <option value={text(row45.v46)}>
                                {row45.v47}
                                {" · "}
                                {row45.v48}
                              </option>
                            </Fragment>
                          ))
                        ) : (
                          <></>
                        )}
                      </SelectField>
                      <Field
                        className={"inp"}
                        style={cssStyle("width:80px")}
                        name={"qty"}
                        value={"1"}
                      />
                      <button className={"btn btn-line btn-sm"}>{"Add"}</button>
                      {"\n    "}
                    </ActionForm>
                    {"\n    "}
                    <ActionForm
                      method={"post"}
                      action={"/app/p/" + text(data.v49) + "/do/quote_reset/"}
                      style={cssStyle("padding:0 1.1rem 1rem")}
                      data-confirm={
                        "Discard your edits and rebuild from the template?"
                      }
                    >
                      <CsrfField />
                      <button className={"btn btn-line btn-sm"}>
                        {"Reset to template"}
                      </button>
                    </ActionForm>
                  </>
                ) : null}
                {"\n  "}
              </div>
            </div>
            {"\n  "}
            <div className={"stack"}>
              {"\n    "}
              <div className={"card"}>
                <div className={"card-b"}>
                  {"\n      "}
                  <div className={"spread"}>
                    <span className={"muted"}>{"Subtotal"}</span>
                    <span>{data.v50}</span>
                  </div>
                  {"\n      "}
                  {data.choice51 === 0 ? (
                    <>
                      <div className={"spread"}>
                        <span className={"muted"}>
                          {"Discount ("}
                          {data.v52}
                          {"%)"}
                        </span>
                        <span>
                          {"-"}
                          {data.v53}
                        </span>
                      </div>
                    </>
                  ) : null}
                  {"\n      "}
                  <div className={"spread"}>
                    <span className={"muted"}>{"GST"}</span>
                    <span>{data.v54}</span>
                  </div>
                  {"\n      "}
                  <div
                    className={"spread bold"}
                    style={cssStyle(
                      "font-size:1.2rem;border-top:2px solid var(--ink);margin-top:.4rem;padding-top:.5rem",
                    )}
                  >
                    <span>{"Total"}</span>
                    <span>{data.v55}</span>
                  </div>
                  {"\n      "}
                  {data.choice56 === 0 ? (
                    <>
                      <div
                        className={"banner info mt"}
                        style={cssStyle("padding:.6rem .8rem")}
                      >
                        <div className={"small"}>
                          <b>
                            {"Subsidy "}
                            {data.v57}
                          </b>
                          {
                            " goes to the customer, not to us. Net cost to them about "
                          }
                          {data.v58}
                          {"."}
                        </div>
                      </div>
                    </>
                  ) : null}
                  {"\n      "}
                  {data.choice59 === 0 ? (
                    <>
                      <div className={"spread mt"}>
                        <span className={"muted small"}>
                          {"Estimated margin"}
                        </span>
                        <span
                          className={
                            "badge " +
                            (data.choice60 === 0
                              ? "b-red"
                              : data.choice60 === 1
                                ? "b-amber"
                                : data.choice60 === 2
                                  ? "b-green"
                                  : "")
                          }
                        >
                          {data.v61}
                          {"% · "}
                          {data.v62}
                        </span>
                      </div>
                    </>
                  ) : null}
                  {"\n    "}
                </div>
              </div>
              {"\n    "}
              <div className={"card"}>
                <div className={"card-h"}>
                  <h2>{"Parts check"}</h2>
                </div>
                <div className={"card-b small"}>
                  {"\n      "}
                  {data.rows63?.length ? (
                    data.rows63.map((row63, index) => (
                      <Fragment key={index}>
                        <div
                          className={"spread"}
                          style={cssStyle("padding:.15rem 0")}
                        >
                          <span>{row63.v64}</span>
                          {row63.choice65 === 0 ? (
                            <>
                              <span className={"badge b-green"}>
                                {"✓ on quote"}
                              </span>
                            </>
                          ) : row63.choice65 === 1 ? (
                            <>
                              <span className={"badge b-red"}>
                                {"✕ missing"}
                              </span>
                            </>
                          ) : null}
                        </div>
                      </Fragment>
                    ))
                  ) : (
                    <></>
                  )}
                  {"\n      "}
                  <p className={"hint mt-s"}>
                    {
                      "Required part categories must all be on the quote before it can be sent."
                    }
                  </p>
                </div>
              </div>
              {"\n    "}
              {data.choice66 === 0 ? (
                <>
                  <div className={"card"}>
                    <div className={"card-h"}>
                      <h2>{"Send to customer"}</h2>
                    </div>
                    <div className={"card-b"}>
                      {"\n      "}
                      <ActionForm
                        method={"post"}
                        action={"/app/p/" + text(data.v67) + "/do/quote_send/"}
                        className={"stack"}
                      >
                        <CsrfField />
                        {"\n        "}
                        {data.choice68 === 0 ? (
                          <>
                            <div className={"gate"}>
                              {"Required parts missing: "}
                              {data.v69}
                              {"."}
                            </div>
                            {"\n        "}
                            {data.choice70 === 0 ? (
                              <>
                                <FieldGroup className={"field"}>
                                  <label>
                                    {"Override reason (Engineer or Director)"}
                                  </label>
                                  <Field
                                    className={"inp"}
                                    name={"override_reason"}
                                    placeholder={"Why is this part not needed?"}
                                  />
                                </FieldGroup>
                              </>
                            ) : null}
                          </>
                        ) : null}
                        {"\n        "}
                        <button
                          className={
                            "btn btn-primary btn-block " +
                            (data.choice71 === 0 ? "is-disabled" : "")
                          }
                          {...(data.attr72 === 0
                            ? {
                                title:
                                  "Required parts missing: " + text(data.v73),
                              }
                            : {})}
                        >
                          {"Send quote"}
                        </button>
                        {"\n      "}
                      </ActionForm>
                    </div>
                  </div>
                  {"\n    "}
                </>
              ) : data.choice66 === 1 ? (
                <>
                  <div className={"card"}>
                    <div className={"card-h"}>
                      <h2>{"Customer replies"}</h2>
                    </div>
                    <div className={"card-b"}>
                      {"\n      "}
                      <p className={"small muted"}>
                        {
                          "Waiting for the customer to accept in their portal. If they said yes on the phone:"
                        }
                      </p>
                      {"\n      "}
                      <ActionForm
                        method={"post"}
                        action={
                          "/app/p/" + text(data.v74) + "/do/quote_accept/"
                        }
                        className={"stack"}
                      >
                        <CsrfField />
                        {"\n        "}
                        <Field
                          className={"inp"}
                          name={"name"}
                          value={text(data.v75)}
                          placeholder={"Name of the person who accepted"}
                        />
                        <Field
                          className={"inp"}
                          name={"note"}
                          placeholder={"How? e.g. phone call on 31 Oct"}
                        />
                        {"\n        "}
                        <button className={"btn btn-line btn-block"}>
                          {"Record acceptance"}
                        </button>
                      </ActionForm>
                    </div>
                  </div>
                  {"\n    "}
                </>
              ) : data.choice66 === 2 ? (
                <>
                  <div className={"banner ok"}>
                    <span className={"ico"}>{"✓"}</span>
                    <div>
                      {"Accepted by "}
                      <b>{data.v76}</b>
                      {" on "}
                      {data.v77}
                      {"."}
                    </div>
                  </div>
                </>
              ) : null}
              {"\n  "}
            </div>
            {"\n"}
          </div>
          {"\n"}
        </>
      ) : null}
      {"\n"}
    </>
  );
}
